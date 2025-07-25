// Supabase API functions for Design Review Board

// Check if Supabase is properly initialized
function isSupabaseReady() {
  return typeof supabase !== 'undefined' && supabase !== null;
}

// Check if current user is admin
async function isUserAdmin() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    // For now, we'll use a simple email-based admin check
    // In production, you'd want a proper role-based system
    const adminEmails = [
      // Add admin email addresses here
      'robby@puresurvey.co.za'
    ];
    
    return adminEmails.includes(user.email);
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// Get all selected designs
async function getSelectedDesigns() {
  try {
    if (!isSupabaseReady()) {
      console.error('Supabase is not initialized');
      return [];
    }
    
    const { data, error } = await supabase
      .from('design_selections')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching selected designs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting selected designs:', error);
    return [];
  }
}



// Mark a design as selected for iteration
async function markDesignForIteration(designId, selected = true, currentSelections = null) {
  try {
    if (!isSupabaseReady()) {
      console.error('Supabase is not initialized');
      return false;
    }
    
    // Check if user is admin
    const isAdmin = await isUserAdmin();
    if (!isAdmin) {
      console.error('User is not admin');
      return false;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('User not authenticated');
      return false;
    }

    if (selected) {
      // Check if already selected using passed selections or fallback to database query
      let existing = false;
      if (currentSelections && currentSelections.has) {
        existing = currentSelections.has(designId);
      } else {
        // Fallback to database query if no selections passed
        const { data } = await supabase
          .from('design_selections')
          .select('design_id')
          .eq('design_id', designId)
          .limit(1);
        existing = data && data.length > 0;
      }
      
      if (existing) {
        return true; // Already selected
      }
      
      // Mark as selected
      const { error } = await supabase
        .from('design_selections')
        .insert({
          design_id: designId,
          selected_by: user.id,
          selected_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error marking design as selected:', error);
        return false;
      }
    } else {
      // Remove selection
      const { error } = await supabase
        .from('design_selections')
        .delete()
        .eq('design_id', designId);

      if (error) {
        console.error('Error removing design selection:', error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error marking design for iteration:', error);
    return false;
  }
}

// Get all feedback data for a design
async function getFeedbackData(designId) {
  try {
    // Check if Supabase is ready
    if (!isSupabaseReady()) {
      console.error('Supabase is not initialized');
      return { likes: 0, dislikes: 0, comments: [], userVote: null };
    }
    
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('design_id', designId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    // Get current user's vote
    const { data: { user } } = await supabase.auth.getUser();
    let userVote = null;
    
    if (user && data) {
      const userVoteData = data.find(item => 
        item.user_id === user.id && (item.vote_type === 'like' || item.vote_type === 'dislike')
      );
      if (userVoteData) {
        userVote = userVoteData.vote_type;
      }
    }

    // Process the data to match our existing format
    const feedback = {
      likes: 0,
      dislikes: 0,
      comments: [],
      userVote: userVote
    };

    if (data) {
      data.forEach(item => {
        if (item.vote_type === 'like') feedback.likes++;
        if (item.vote_type === 'dislike') feedback.dislikes++;
        if (item.comment_text) {
          feedback.comments.push({
            text: item.comment_text,
            username: item.username || 'Anonymous',
            timestamp: item.created_at,
            user_id: item.user_id
          });
        }
      });
    }

    return feedback;
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return { likes: 0, dislikes: 0, comments: [], userVote: null };
  }
}

// Submit a vote (like or dislike) - handles vote changes and prevents duplicates
async function submitVote(designId, voteType) {
  try {
    // Check if Supabase is ready
    if (!isSupabaseReady()) {
      console.error('Supabase is not initialized');
      return false;
    }
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('User not authenticated');
      return false;
    }
    
    const userId = user.id;
    
    // First, check if user has already voted on this design
    const { data: existingVotes, error: fetchError } = await supabase
      .from('feedback')
      .select('*')
      .eq('design_id', designId)
      .eq('user_id', userId)
      .or('vote_type.eq.like,vote_type.eq.dislike');

    if (fetchError) {
      console.error('Error fetching existing votes:', fetchError);
      throw fetchError;
    }

    if (existingVotes && existingVotes.length > 0) {
      // User has already voted - update their vote
      const existingVote = existingVotes[0];
      
      if (existingVote.vote_type === voteType) {
        // User is clicking the same vote type - remove their vote
        const { error: deleteError } = await supabase
          .from('feedback')
          .delete()
          .eq('id', existingVote.id);
          
        if (deleteError) {
          console.error('Error deleting vote:', deleteError);
          throw deleteError;
        }
      } else {
        // User is changing their vote - update it
        // Get user's display name or email
        const { data: { user } } = await supabase.auth.getUser();
        let username = 'Anonymous';
        
        if (user) {
          // Try to get the user's display name from Google metadata
          if (user.user_metadata && user.user_metadata.full_name) {
            username = user.user_metadata.full_name;
          } else if (user.user_metadata && user.user_metadata.name) {
            username = user.user_metadata.name;
          } else if (user.email) {
            username = user.email.split('@')[0];
          }
        }
        
        const { error: updateError } = await supabase
          .from('feedback')
          .update({ 
            vote_type: voteType,
            username: username
          })
          .eq('id', existingVote.id);
          
        if (updateError) {
          console.error('Error updating vote:', updateError);
          throw updateError;
        }
      }
    } else {
      // User hasn't voted yet - insert new vote
      // Get user's display name or email
      const { data: { user } } = await supabase.auth.getUser();
      let username = 'Anonymous';
      
      if (user) {
        console.log('User metadata:', user.user_metadata);
        console.log('User email:', user.email);
        
        // Try to get the user's display name from Google metadata
        if (user.user_metadata && user.user_metadata.full_name) {
          username = user.user_metadata.full_name;
        } else if (user.user_metadata && user.user_metadata.name) {
          username = user.user_metadata.name;
        } else if (user.email) {
          username = user.email.split('@')[0];
        }
        
        console.log('Selected username:', username);
      }
      
      const { error: insertError } = await supabase
        .from('feedback')
        .insert({
          design_id: designId,
          vote_type: voteType,
          user_id: userId,
          username: username
        });

      if (insertError) {
        console.error('Error inserting vote:', insertError);
        throw insertError;
      }
    }

    return true;
  } catch (error) {
    console.error('Error submitting vote:', error);
    return false;
  }
}



// Submit a comment
async function submitComment(designId, commentText, username) {
  try {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('User not authenticated');
      return false;
    }

    const { error } = await supabase
      .from('feedback')
      .insert({
        design_id: designId,
        comment_text: commentText,
        username: username || 'Anonymous',
        user_id: user.id
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error submitting comment:', error);
    return false;
  }
}

// Delete a comment (by user ID for security)
async function deleteCommentFromSupabase(designId, commentText, username) {
  try {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('User not authenticated');
      return false;
    }

    const { error } = await supabase
      .from('feedback')
      .delete()
      .eq('design_id', designId)
      .eq('comment_text', commentText)
      .eq('user_id', user.id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting comment:', error);
    return false;
  }
}

// Get all feedback for all designs (for statistics)
async function getAllFeedback() {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get current user's vote for all designs
    const { data: { user } } = await supabase.auth.getUser();
    const userVotes = {};
    
    if (user && data) {
      data.forEach(item => {
        if ((item.vote_type === 'like' || item.vote_type === 'dislike') && item.user_id === user.id) {
          userVotes[item.design_id] = item.vote_type;
        }
      });
    }

    // Group by design_id
    const grouped = {};
    data.forEach(item => {
      if (!grouped[item.design_id]) {
        grouped[item.design_id] = {
          likes: 0,
          dislikes: 0,
          comments: [],
          userVote: userVotes[item.design_id] || null
        };
      }
      
      if (item.vote_type === 'like') grouped[item.design_id].likes++;
      if (item.vote_type === 'dislike') grouped[item.design_id].dislikes++;
      if (item.comment_text) {
        grouped[item.design_id].comments.push({
          text: item.comment_text,
          username: item.username || 'Anonymous',
          timestamp: item.created_at,
          user_id: item.user_id
        });
      }
    });

    return grouped;
  } catch (error) {
    console.error('Error fetching all feedback:', error);
    return {};
  }
}

// Get users who voted for a design
async function getVotersForDesign(designId) {
  try {
    if (!isSupabaseReady()) {
      console.error('Supabase is not initialized');
      return { likes: [], dislikes: [] };
    }
    
    const { data, error } = await supabase
      .from('feedback')
      .select('username, vote_type, created_at')
      .eq('design_id', designId)
      .or('vote_type.eq.like,vote_type.eq.dislike')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching voters:', error);
      return { likes: [], dislikes: [] };
    }

    const voters = {
      likes: [],
      dislikes: []
    };

    if (data) {
      data.forEach(item => {
        if (item.vote_type === 'like') {
          voters.likes.push({
            username: item.username || 'Anonymous',
            timestamp: item.created_at
          });
        } else if (item.vote_type === 'dislike') {
          voters.dislikes.push({
            username: item.username || 'Anonymous',
            timestamp: item.created_at
          });
        }
      });
    }

    return voters;
  } catch (error) {
    console.error('Error getting voters for design:', error);
    return { likes: [], dislikes: [] };
  }
}

// Update anonymous votes with real usernames
async function updateAnonymousVotes() {
  try {
    if (!isSupabaseReady()) {
      console.error('Supabase is not initialized');
      return false;
    }
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('User not authenticated');
      return false;
    }
    
    // Get user's real name
    let username = 'Anonymous';
    if (user.user_metadata && user.user_metadata.full_name) {
      username = user.user_metadata.full_name;
    } else if (user.user_metadata && user.user_metadata.name) {
      username = user.user_metadata.name;
    } else if (user.email) {
      username = user.email.split('@')[0];
    }
    
    // Find all anonymous votes by this user
    const { data: anonymousVotes, error } = await supabase
      .from('feedback')
      .select('id, design_id, vote_type')
      .eq('user_id', user.id)
      .eq('username', 'Anonymous')
      .or('vote_type.eq.like,vote_type.eq.dislike');
    
    if (error) {
      console.error('Error fetching anonymous votes:', error);
      return false;
    }
    
    if (anonymousVotes && anonymousVotes.length > 0) {
      // Update all anonymous votes with real username
      const { error: updateError } = await supabase
        .from('feedback')
        .update({ username: username })
        .eq('user_id', user.id)
        .eq('username', 'Anonymous')
        .or('vote_type.eq.like,vote_type.eq.dislike');
      
      if (updateError) {
        console.error('Error updating anonymous votes:', updateError);
        return false;
      }
      
      console.log(`Updated ${anonymousVotes.length} anonymous votes with username: ${username}`);
      return true;
    }
    
    return true;
  } catch (error) {
    console.error('Error updating anonymous votes:', error);
    return false;
  }
}

// Real-time subscription for live updates
function subscribeToFeedback(designId, callback) {
  return supabase
    .channel(`feedback-${designId}`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'feedback',
        filter: `design_id=eq.${designId}`
      }, 
      callback
    )
    .subscribe();
} 