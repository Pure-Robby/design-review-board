-- Create design_selections table for admin selections
CREATE TABLE IF NOT EXISTS design_selections (
  id SERIAL PRIMARY KEY,
  design_id TEXT NOT NULL UNIQUE,
  selected_by UUID REFERENCES auth.users(id),
  selected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS (Row Level Security) policies
ALTER TABLE design_selections ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read selections
CREATE POLICY "Allow authenticated users to read design selections" ON design_selections
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow only admins to insert/update/delete selections
CREATE POLICY "Allow admins to manage design selections" ON design_selections
  FOR ALL USING (
    auth.role() = 'authenticated' 
    AND auth.email() IN (
      -- Add admin email addresses here
      'your-admin-email@example.com'
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_design_selections_design_id ON design_selections(design_id);
CREATE INDEX IF NOT EXISTS idx_design_selections_selected_by ON design_selections(selected_by); 