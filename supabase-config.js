// Supabase configuration
// Replace these with your actual Supabase project credentials
const SUPABASE_CONFIG = {
  url: 'https://qnvjyalqwuxjxegbaapq.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFudmp5YWxxd3V4anhlZ2JhYXBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDE4NTIsImV4cCI6MjA2NzExNzg1Mn0.cl640qdF0ew7WoifLvZXSdquhwOkv5SWIpohwG-4ESw'
};

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

// Auth state management
let currentUser = null;

// Check if user is authenticated on page load
async function checkAuthState() {
  const { data: { user } } = await supabase.auth.getUser();
  currentUser = user;
  updateAuthUI();
  return user;
}

// Sign in with Google
async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.href
    }
  });
  
  if (error) {
    console.error('Error signing in with Google:', error);
    return false;
  }
  
  return true;
}

// Sign out
async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
    return false;
  }
  
  currentUser = null;
  updateAuthUI();
  return true;
}

// Update UI based on auth state
function updateAuthUI() {
  const authContainer = document.getElementById('authContainer');
  if (!authContainer) return;
  
  if (currentUser) {
    authContainer.innerHTML = `
      <div class="auth-user">
        <img src="${currentUser.user_metadata?.avatar_url || 'https://via.placeholder.com/32'}" 
             alt="Profile" class="user-avatar">
        <span class="user-name">${currentUser.user_metadata?.full_name || currentUser.email}</span>
        <button onclick="signOut()" class="auth-btn sign-out-btn">
          <i class="fa-solid fa-sign-out-alt"></i> Sign Out
        </button>
      </div>
    `;
  } else {
    authContainer.innerHTML = `
      <button onclick="signInWithGoogle()" class="auth-btn sign-in-btn">
        <i class="fab fa-google"></i> Sign in with Google
      </button>
    `;
  }
}

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    currentUser = session.user;
    updateAuthUI();
    // Refresh user vote cache with new user (if function is available)
    if (typeof window.refreshUserVoteCache === 'function') {
      window.refreshUserVoteCache();
    }
  } else if (event === 'SIGNED_OUT') {
    currentUser = null;
    updateAuthUI();
    // Clear user vote cache (if function is available)
    if (typeof window.clearUserVoteCache === 'function') {
      window.clearUserVoteCache();
    }
  }
}); 