# Google Authentication Setup Guide

## 🚀 Setting up Google OAuth in Supabase

### Step 1: Configure Google OAuth in Supabase Dashboard

1. **Go to your Supabase project dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Authentication Settings**
   - Go to **Authentication** → **Providers**
   - Find **Google** in the list

3. **Enable Google Provider**
   - Toggle **Enable** to turn on Google authentication
   - Save the changes

### Step 2: Create Google OAuth Credentials

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Create a new project or select existing one

2. **Enable Google+ API**
   - Go to **APIs & Services** → **Library**
   - Search for "Google+ API" and enable it

3. **Create OAuth 2.0 Credentials**
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth 2.0 Client IDs**
   - Choose **Web application**

4. **Configure OAuth Client**
   - **Name**: "Design Review Board" (or your preferred name)
   - **Authorized JavaScript origins**:
     ```
     https://qnvjyalqwuxjxegbaapq.supabase.co
     http://localhost:3000 (for local development)
     ```
   - **Authorized redirect URIs**:
     ```
     https://qnvjyalqwuxjxegbaapq.supabase.co/auth/v1/callback
     ```

5. **Copy Credentials**
   - Note down the **Client ID** and **Client Secret**

### Step 3: Add Credentials to Supabase

1. **Back to Supabase Dashboard**
   - Go to **Authentication** → **Providers** → **Google**

2. **Enter Google Credentials**
   - **Client ID**: Paste your Google Client ID
   - **Client Secret**: Paste your Google Client Secret
   - **Redirect URL**: `https://qnvjyalqwuxjxegbaapq.supabase.co/auth/v1/callback`

3. **Save Configuration**
   - Click **Save** to apply the changes

### Step 4: Update Database Schema (Optional)

If you want to store additional user information, you can create a `profiles` table:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### Step 5: Test the Implementation

1. **Refresh your app page**
2. **Click "Sign in with Google"**
3. **Complete Google OAuth flow**
4. **Verify user appears in top-right corner**

## 🔧 Troubleshooting

### Common Issues:

1. **"Invalid redirect URI"**
   - Double-check the redirect URI in Google Console matches Supabase
   - Ensure no trailing slashes

2. **"Client ID not found"**
   - Verify Client ID is copied correctly
   - Check that Google+ API is enabled

3. **"OAuth consent screen not configured"**
   - Go to Google Console → OAuth consent screen
   - Add your domain to authorized domains

4. **"CORS errors"**
   - Ensure your domain is in authorized origins
   - Check that you're using HTTPS in production

### Security Notes:

- **Never expose Client Secret** in frontend code
- **Use HTTPS** in production
- **Configure proper redirect URIs** to prevent unauthorized redirects
- **Enable Row Level Security** on your tables

## 🎉 What You Get

After setup, users can:
- ✅ Sign in with their Google account
- ✅ Vote on designs (tied to their account)
- ✅ Leave comments with their real name
- ✅ Sign out and switch accounts
- ✅ Persistent login across sessions

The app will now have proper user authentication instead of anonymous localStorage tracking! 