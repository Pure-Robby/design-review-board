-- Fix RLS policies for design_selections table
-- Drop existing policies first
DROP POLICY IF EXISTS "Allow authenticated users to read design selections" ON design_selections;
DROP POLICY IF EXISTS "Allow admins to manage design selections" ON design_selections;

-- Recreate policies with correct admin email
-- Allow all authenticated users to read selections
CREATE POLICY "Allow authenticated users to read design selections" ON design_selections
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow only admins to insert/update/delete selections
CREATE POLICY "Allow admins to manage design selections" ON design_selections
  FOR ALL USING (
    auth.role() = 'authenticated' 
    AND auth.email() IN (
      -- Add admin email addresses here
      'robby@puresurvey.co.za'
    )
  ); 