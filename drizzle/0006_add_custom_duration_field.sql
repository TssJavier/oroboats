-- Añadir campo para controlar si se permite duración personalizada
ALTER TABLE vehicles ADD COLUMN custom_duration_enabled BOOLEAN DEFAULT true;

-- Actualizar vehículos existentes para que tengan duración personalizada habilitada por defecto
UPDATE vehicles SET custom_duration_enabled = true WHERE custom_duration_enabled IS NULL;
