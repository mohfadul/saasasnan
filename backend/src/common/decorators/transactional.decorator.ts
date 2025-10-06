import { SetMetadata } from '@nestjs/common';

export const TRANSACTIONAL_KEY = 'transactional';

/**
 * Decorator to mark methods that should run within a database transaction
 * Usage: @Transactional() on service methods
 */
export const Transactional = () => SetMetadata(TRANSACTIONAL_KEY, true);

