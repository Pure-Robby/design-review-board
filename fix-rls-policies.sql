-- Fix RLS policies for design_selections table with more permissive read access
-- Drop existing policies first
DROP POLICY IF EXISTS "Allow authenticated users to read design selections" ON design_selections;
DROP POLICY IF EXISTS "Allow admins to manage design selections" ON design_selections;
DROP POLICY IF EXISTS "Allow all authenticated users to read design selections" ON design_selections;
DROP POLICY IF EXISTS "Allow admins to modify design selections" ON design_selections;

-- Create a very permissive read policy that allows all authenticated users to read
CREATE POLICY "Allow all users to read design selections" ON design_selections
  FOR SELECT USING (true);

-- Create a policy that allows only admins to insert/update/delete
CREATE POLICY "Allow admins to modify design selections" ON design_selections
  FOR ALL USING (auth.email() = 'robby@puresurvey.co.za');

-- If the above still doesn't work, try completely disabling RLS temporarily for testing
-- ALTER TABLE design_selections DISABLE ROW LEVEL SECURITY; 