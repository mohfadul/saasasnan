-- Rename plan_name to title to match backend expectations
ALTER TABLE treatment_plans 
CHANGE COLUMN plan_name title VARCHAR(255) NOT NULL;

