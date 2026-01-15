-- NUCLEAR FIX: Completely reset vendor_profiles RLS policies
-- This drops ALL policies dynamically, not by name

-- Step 1: Drop ALL policies on vendor_profiles using dynamic SQL
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies 
    WHERE tablename = 'vendor_profiles' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.vendor_profiles', pol.policyname);
    RAISE NOTICE 'Dropped policy: %', pol.policyname;
  END LOOP;
END $$;

-- Step 2: Temporarily disable RLS to ensure we can work with the table
ALTER TABLE public.vendor_profiles DISABLE ROW LEVEL SECURITY;

-- Step 3: Re-enable RLS
ALTER TABLE public.vendor_profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create minimal, non-recursive policies
-- Using ONLY auth.uid() checks - NO subqueries to other tables in USING clause

-- SELECT policy (simple)
CREATE POLICY "vp_select" ON public.vendor_profiles
  FOR SELECT USING (true);  -- Allow all reads (simplest approach)

-- INSERT policy
CREATE POLICY "vp_insert" ON public.vendor_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- UPDATE policy - THE KEY FIX: Only check user_id = auth.uid(), nothing else
CREATE POLICY "vp_update" ON public.vendor_profiles
  FOR UPDATE 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE policy
CREATE POLICY "vp_delete" ON public.vendor_profiles
  FOR DELETE USING (user_id = auth.uid());
