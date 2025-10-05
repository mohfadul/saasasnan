#!/bin/bash

# Healthcare SaaS Deployment Script
# This script handles automated deployment with rollback capabilities

set -e

# Configuration
NAMESPACE="healthcare"
BACKEND_IMAGE="ghcr.io/your-org/healthcare-saas/backend"
FRONTEND_IMAGE="ghcr.io/your-org/healthcare-saas/frontend"
BACKEND_TAG="${1:-latest}"
FRONTEND_TAG="${2:-latest}"
ENVIRONMENT="${3:-staging}"
DRY_RUN="${4:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Pre-deployment checks
pre_deployment_checks() {
    log_info "Running pre-deployment checks..."
    
    # Check if kubectl is available
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    # Check if cluster is accessible
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    # Check if namespace exists
    if ! kubectl get namespace $NAMESPACE &> /dev/null; then
        log_warning "Namespace $NAMESPACE does not exist, creating..."
        kubectl create namespace $NAMESPACE
    fi
    
    # Check if images exist
    log_info "Verifying Docker images exist..."
    if ! docker manifest inspect $BACKEND_IMAGE:$BACKEND_TAG &> /dev/null; then
        log_error "Backend image $BACKEND_IMAGE:$BACKEND_TAG not found"
        exit 1
    fi
    
    if ! docker manifest inspect $FRONTEND_IMAGE:$FRONTEND_TAG &> /dev/null; then
        log_error "Frontend image $FRONTEND_IMAGE:$FRONTEND_TAG not found"
        exit 1
    fi
    
    log_success "Pre-deployment checks passed"
}

# Database migration
run_migrations() {
    log_info "Running database migrations..."
    
    # Create migration job
    cat <<EOF | kubectl apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: healthcare-migration-$(date +%s)
  namespace: $NAMESPACE
spec:
  template:
    spec:
      containers:
      - name: migration
        image: $BACKEND_IMAGE:$BACKEND_TAG
        command: ["npm", "run", "migrate:up"]
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: url
        - name: NODE_ENV
          value: "$ENVIRONMENT"
      restartPolicy: Never
  backoffLimit: 3
EOF
    
    # Wait for migration to complete
    kubectl wait --for=condition=complete job/healthcare-migration-$(date +%s) -n $NAMESPACE --timeout=300s
    
    if [ $? -eq 0 ]; then
        log_success "Database migrations completed successfully"
    else
        log_error "Database migrations failed"
        exit 1
    fi
}

# Deploy backend
deploy_backend() {
    log_info "Deploying backend..."
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN: Would deploy backend with image $BACKEND_IMAGE:$BACKEND_TAG"
        return 0
    fi
    
    # Update deployment image
    kubectl set image deployment/healthcare-backend backend=$BACKEND_IMAGE:$BACKEND_TAG -n $NAMESPACE
    
    # Wait for rollout to complete
    kubectl rollout status deployment/healthcare-backend -n $NAMESPACE --timeout=600s
    
    if [ $? -eq 0 ]; then
        log_success "Backend deployment completed successfully"
    else
        log_error "Backend deployment failed"
        rollback_backend
        exit 1
    fi
}

# Deploy frontend
deploy_frontend() {
    log_info "Deploying frontend..."
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN: Would deploy frontend with image $FRONTEND_IMAGE:$FRONTEND_TAG"
        return 0
    fi
    
    # Update deployment image
    kubectl set image deployment/healthcare-frontend frontend=$FRONTEND_IMAGE:$FRONTEND_TAG -n $NAMESPACE
    
    # Wait for rollout to complete
    kubectl rollout status deployment/healthcare-frontend -n $NAMESPACE --timeout=600s
    
    if [ $? -eq 0 ]; then
        log_success "Frontend deployment completed successfully"
    else
        log_error "Frontend deployment failed"
        rollback_frontend
        exit 1
    fi
}

# Health check
health_check() {
    log_info "Running health checks..."
    
    # Check backend health
    BACKEND_HEALTH=$(kubectl get pods -n $NAMESPACE -l app=healthcare-backend --field-selector=status.phase=Running -o jsonpath='{.items[*].status.phase}' | grep -c "Running")
    if [ "$BACKEND_HEALTH" -lt 1 ]; then
        log_error "Backend health check failed"
        return 1
    fi
    
    # Check frontend health
    FRONTEND_HEALTH=$(kubectl get pods -n $NAMESPACE -l app=healthcare-frontend --field-selector=status.phase=Running -o jsonpath='{.items[*].status.phase}' | grep -c "Running")
    if [ "$FRONTEND_HEALTH" -lt 1 ]; then
        log_error "Frontend health check failed"
        return 1
    fi
    
    # Test API endpoints
    BACKEND_SERVICE=$(kubectl get service healthcare-backend-service -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    if [ -n "$BACKEND_SERVICE" ]; then
        if curl -f http://$BACKEND_SERVICE/health &> /dev/null; then
            log_success "Backend API health check passed"
        else
            log_error "Backend API health check failed"
            return 1
        fi
    fi
    
    log_success "All health checks passed"
    return 0
}

# Rollback functions
rollback_backend() {
    log_warning "Rolling back backend deployment..."
    kubectl rollout undo deployment/healthcare-backend -n $NAMESPACE
    kubectl rollout status deployment/healthcare-backend -n $NAMESPACE --timeout=300s
    log_success "Backend rollback completed"
}

rollback_frontend() {
    log_warning "Rolling back frontend deployment..."
    kubectl rollout undo deployment/healthcare-frontend -n $NAMESPACE
    kubectl rollout status deployment/healthcare-frontend -n $NAMESPACE --timeout=300s
    log_success "Frontend rollback completed"
}

# Notification functions
send_notification() {
    local status=$1
    local message=$2
    
    # Slack notification
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"Healthcare SaaS Deployment $status: $message\"}" \
            $SLACK_WEBHOOK_URL
    fi
    
    # Email notification (if configured)
    if [ -n "$NOTIFICATION_EMAIL" ]; then
        echo "Healthcare SaaS Deployment $status: $message" | mail -s "Deployment $status" $NOTIFICATION_EMAIL
    fi
}

# Main deployment function
main() {
    log_info "Starting Healthcare SaaS deployment..."
    log_info "Environment: $ENVIRONMENT"
    log_info "Backend Image: $BACKEND_IMAGE:$BACKEND_TAG"
    log_info "Frontend Image: $FRONTEND_IMAGE:$FRONTEND_TAG"
    
    # Create deployment backup
    log_info "Creating deployment backup..."
    kubectl get deployment healthcare-backend -n $NAMESPACE -o yaml > backup/backend-backup-$(date +%Y%m%d-%H%M%S).yaml
    kubectl get deployment healthcare-frontend -n $NAMESPACE -o yaml > backup/frontend-backup-$(date +%Y%m%d-%H%M%S).yaml
    
    # Run pre-deployment checks
    pre_deployment_checks
    
    # Run migrations
    run_migrations
    
    # Deploy backend
    deploy_backend
    
    # Deploy frontend
    deploy_frontend
    
    # Health check
    if health_check; then
        log_success "Deployment completed successfully!"
        send_notification "SUCCESS" "Deployment to $ENVIRONMENT completed successfully"
        
        # Clean up old replicas
        kubectl delete pods -n $NAMESPACE --field-selector=status.phase=Succeeded
        kubectl delete pods -n $NAMESPACE --field-selector=status.phase=Failed
    else
        log_error "Health check failed, rolling back..."
        rollback_backend
        rollback_frontend
        send_notification "FAILED" "Deployment to $ENVIRONMENT failed and was rolled back"
        exit 1
    fi
}

# Cleanup function
cleanup() {
    log_info "Cleaning up temporary resources..."
    kubectl delete jobs -n $NAMESPACE -l app=healthcare-migration
}

# Trap for cleanup on exit
trap cleanup EXIT

# Run main function
main "$@"
