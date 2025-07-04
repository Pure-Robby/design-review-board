// Supabase API functions for Design Review Board

// Check if Supabase is properly initialized
function isSupabaseReady() {
  return typeof supabase !== 'undefined' && supabase !== null;
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
        const { error: updateError } = await supabase
          .from('feedback')
          .update({ vote_type: voteType })
          .eq('id', existingVote.id);
          
        if (updateError) {
          console.error('Error updating vote:', updateError);
          throw updateError;
        }
      }
    } else {
      // User hasn't voted yet - insert new vote
      const { error: insertError } = await supabase
        .from('feedback')
        .insert({
          design_id: designId,
          vote_type: voteType,
          user_id: userId
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