const fullImage = document.getElementById('fullImage');
const lightbox = document.getElementById('lightbox');
const commentList = document.getElementById('commentList');
const commentInputSidebar = document.getElementById('commentInputSidebar');
const submitCommentSidebar = document.getElementById('submitCommentSidebar');
const closeBtn = document.getElementById('lightboxClose');
const designTitle = document.getElementById('designTitle');

let currentDesign = null;
let currentThemeDesigns = []; // Array to store designs for current theme slideshow
let currentDesignIndex = 0; // Current position in slideshow
let currentTheme = null; // Current theme folder

// Cache for all feedback data to eliminate database calls during navigation
let allFeedbackCache = null;

// Get feedback data from cache or fallback to API
async function getFeedbackDataFromCache(design) {
  // If we have cached data, use it
  if (allFeedbackCache && allFeedbackCache[design]) {
    return allFeedbackCache[design];
  }
  
  // Fallback to API call if cache is not available
  return await getFeedbackData(design);
}

// Get feedback data from cache synchronously (for immediate UI updates)
function getFeedbackDataFromCacheSync(design) {
  // If we have cached data, use it
  if (allFeedbackCache && allFeedbackCache[design]) {
    return allFeedbackCache[design];
  }
  
  // Return default data if not in cache
  return { likes: 0, dislikes: 0, comments: [], userVote: null };
}

// Format file name: my-design_v2.png → My Design V2
function formatDesignName(filename) {
  let formattedName = filename;
  
  // If the filename contains a path (theme/filename), extract just the filename part
  if (formattedName.includes('/')) {
    formattedName = formattedName.split('/').pop();
  }
  
  // Remove extension (default behavior for browser)
  formattedName = formattedName.replace(/\.[^/.]+$/, '');
  
  return formattedName
    .replace(/[-_]+/g, ' ') // replace -/_ with space
    .replace(/\b\w/g, (char) => char.toUpperCase()); // capitalize words
}

// Note: getFeedbackData function is defined in supabase-api.js

// Save feedback data to Supabase (async)
async function saveFeedbackData(designId, feedbackData) {
  // This function is kept for compatibility but will be replaced with specific API functions
  console.log('saveFeedbackData called - use specific API functions instead');
}

// Cache for badge data to reduce API calls
const badgeCache = new Map();

// Update vote/comment badges
async function updateBadges(design) {
  // Check cache first
  if (badgeCache.has(design)) {
    const cached = badgeCache.get(design);
    const likeBadge = document.getElementById(`like-${design}`);
    const dislikeBadge = document.getElementById(`dislike-${design}`);
    const commentBadge = document.getElementById(`comments-${design}`);

    if (likeBadge) likeBadge.textContent = cached.likes;
    if (dislikeBadge) dislikeBadge.textContent = cached.dislikes;
    if (commentBadge) commentBadge.textContent = cached.comments;
    return;
  }

  const feedback = await getFeedbackData(design);

  const likeBadge = document.getElementById(`like-${design}`);
  const dislikeBadge = document.getElementById(`dislike-${design}`);
  const commentBadge = document.getElementById(`comments-${design}`);

  if (likeBadge) likeBadge.textContent = feedback.likes;
  if (dislikeBadge) dislikeBadge.textContent = feedback.dislikes;
  if (commentBadge) commentBadge.textContent = feedback.comments.length;
  
  // Update sidebar vote counts if this is the current design
  if (currentDesign === design) {
    const sidebarLikeCount = document.getElementById('sidebarLikeCount');
    const sidebarDislikeCount = document.getElementById('sidebarDislikeCount');
    
    if (sidebarLikeCount) sidebarLikeCount.textContent = feedback.likes;
    if (sidebarDislikeCount) sidebarDislikeCount.textContent = feedback.dislikes;
  }

  // Cache the badge data
  badgeCache.set(design, {
    likes: feedback.likes,
    dislikes: feedback.dislikes,
    comments: feedback.comments.length
  });
}

// Update badge cache for a specific design
function updateBadgeCache(design, likes, dislikes, comments) {
  badgeCache.set(design, { likes, dislikes, comments });
  
  // Update sidebar vote counts if this is the current design
  if (currentDesign === design) {
    const sidebarLikeCount = document.getElementById('sidebarLikeCount');
    const sidebarDislikeCount = document.getElementById('sidebarDislikeCount');
    
    if (sidebarLikeCount) {
      sidebarLikeCount.textContent = likes;
    }
    if (sidebarDislikeCount) {
      sidebarDislikeCount.textContent = dislikes;
    }
  }
  
  // Update the global feedback cache as well
  if (allFeedbackCache && allFeedbackCache[design]) {
    allFeedbackCache[design].likes = likes;
    allFeedbackCache[design].dislikes = dislikes;
    // Preserve existing comments array structure
    if (!allFeedbackCache[design].comments) {
      allFeedbackCache[design].comments = [];
    }
  } else if (allFeedbackCache) {
    // Create new entry if it doesn't exist
    allFeedbackCache[design] = {
      likes: likes,
      dislikes: dislikes,
      comments: [],
      userVote: userVoteCache.get(design) || null
    };
  }
}

// Update theme statistics (most liked and most disliked - mutually exclusive)
async function updateThemeStats() {
  const allFeedback = await getAllFeedback();
  
  document.querySelectorAll('.theme').forEach(async theme => {
    const designs = theme.querySelectorAll('.design-item');
    const designData = [];
    
    for (const designItem of designs) {
      const img = designItem.querySelector('.thumbnail');
      if (img) {
        const designName = img.dataset.design;
        const feedback = allFeedback[designName] || { likes: 0, dislikes: 0 };
        designData.push({
          name: designName,
          likes: feedback.likes,
          dislikes: feedback.dislikes
        });
      }
    }
    
    // Only update statistics if there are multiple designs
    if (designData.length > 1) {
      // Find the design with the most likes
      const mostLiked = designData.reduce((max, design) => 
        design.likes > max.likes ? design : max, designData[0]);
      
      // Find the design with the most dislikes (excluding the most liked design)
      const mostDisliked = designData.reduce((max, design) => {
        // Skip the most liked design when finding most disliked
        if (design.name === mostLiked.name) return max;
        return design.dislikes > max.dislikes ? design : max;
      }, designData.find(d => d.name !== mostLiked.name) || designData[0]);
      
      const mostLikedSpan = theme.querySelector('.design-most-liked');
      const leastLikedSpan = theme.querySelector('.design-least-liked');
      
      if (mostLikedSpan) {
        mostLikedSpan.textContent = mostLiked.likes > 0 ? formatDesignName(mostLiked.name) : '-';
      }
      if (leastLikedSpan) {
        // Only show most disliked if it's different from most liked and has dislikes
        if (mostDisliked.name !== mostLiked.name && mostDisliked.dislikes > 0) {
          leastLikedSpan.textContent = formatDesignName(mostDisliked.name);
        } else {
          leastLikedSpan.textContent = '-';
        }
      }
    }
  });
}

// Cache for user votes to reduce API calls
const userVoteCache = new Map();

// Get user's vote for a specific design (with caching)
async function getUserVote(design) {
  // Check cache first
  if (userVoteCache.has(design)) {
    return userVoteCache.get(design);
  }
  
  // Fallback to API if not in cache
  const feedback = await getFeedbackData(design);
  const userVote = feedback.userVote;
  
  // Cache the result
  userVoteCache.set(design, userVote);
  return userVote;
}

// Save user's vote locally and update cache
function saveUserVote(design, voteType) {
  userVoteCache.set(design, voteType);
}

// Highlight voted icons based on user's votes (fully optimized with caching)
function updateVotedState() {
  // Update thumbnail feedback icons
  document.querySelectorAll('.feedback-icons').forEach((group) => {
    const icons = group.querySelectorAll('i[data-type]');
    icons.forEach((icon) => {
      const design = icon.dataset.design;
      const voteType = icon.dataset.type;
      const userVote = userVoteCache.get(design) || null;
      
      // Remove all voted classes first
      icon.classList.remove('voted');
      
      // Add voted class if user has voted on this design with this type
      if (userVote === voteType) {
        icon.classList.add('voted');
      }
    });
  });
  
  // Update lightbox feedback buttons for current design
  if (currentDesign) {
    const likeBtn = document.getElementById('lightboxLike');
    const dislikeBtn = document.getElementById('lightboxDislike');
    const userVote = userVoteCache.get(currentDesign) || null;
    
    if (likeBtn) {
      likeBtn.classList.remove('voted');
      if (userVote === 'like') {
        likeBtn.classList.add('voted');
      }
    }
    
    if (dislikeBtn) {
      dislikeBtn.classList.remove('voted');
      if (userVote === 'dislike') {
        dislikeBtn.classList.add('voted');
      }
    }
    
    // Update sidebar voting icons
    const sidebarLike = document.getElementById('sidebarLike');
    const sidebarDislike = document.getElementById('sidebarDislike');
    
    if (sidebarLike) {
      sidebarLike.classList.remove('voted');
      if (userVote === 'like') {
        sidebarLike.classList.add('voted');
      }
    }
    
    if (sidebarDislike) {
      sidebarDislike.classList.remove('voted');
      if (userVote === 'dislike') {
        sidebarDislike.classList.add('voted');
      }
    }
  }
}

// Update voted state for a specific design (faster than full update)
function updateVotedStateForDesign(design) {
  const userVote = userVoteCache.get(design) || null;
  
  // Update thumbnail icons for this design
  document.querySelectorAll(`.feedback-icons i[data-design="${design}"]`).forEach(icon => {
    const voteType = icon.dataset.type;
    icon.classList.remove('voted');
    if (userVote === voteType) {
      icon.classList.add('voted');
    }
  });
  
  // Update lightbox buttons if this is the current design
  if (currentDesign === design) {
    const likeBtn = document.getElementById('lightboxLike');
    const dislikeBtn = document.getElementById('lightboxDislike');
    
    if (likeBtn) {
      likeBtn.classList.remove('voted');
      if (userVote === 'like') {
        likeBtn.classList.add('voted');
      }
    }
    
    if (dislikeBtn) {
      dislikeBtn.classList.remove('voted');
      if (userVote === 'dislike') {
        dislikeBtn.classList.add('voted');
      }
    }
    
    // Update sidebar voting icons
    const sidebarLike = document.getElementById('sidebarLike');
    const sidebarDislike = document.getElementById('sidebarDislike');
    
    if (sidebarLike) {
      sidebarLike.classList.remove('voted');
      if (userVote === 'like') {
        sidebarLike.classList.add('voted');
      }
    }
    
    if (sidebarDislike) {
      sidebarDislike.classList.remove('voted');
      if (userVote === 'dislike') {
        sidebarDislike.classList.add('voted');
      }
    }
  }
}

// Delete a comment
async function deleteComment(design, commentIndex) {
  if (confirm('Are you sure you want to delete this comment?')) {
    const feedback = await getFeedbackDataFromCache(design);
    if (feedback.comments && feedback.comments[commentIndex]) {
      const comment = feedback.comments[commentIndex];
      
      // Delete from Supabase
      const success = await deleteCommentFromSupabase(design, comment.text, comment.username);
      
      if (success) {
        // Update global cache by removing the comment
        if (allFeedbackCache && allFeedbackCache[design]) {
          // Remove comment from cache (comments are stored in reverse order in cache)
          const reversedIndex = feedback.comments.length - 1 - commentIndex;
          allFeedbackCache[design].comments.splice(reversedIndex, 1);
        }
        
        // Re-render comments
        renderComments(design);
        
        // Update badge cache immediately with new comment count
        const currentCache = badgeCache.get(design) || { likes: 0, dislikes: 0, comments: 0 };
        const newCommentCount = Math.max(0, currentCache.comments - 1);
        updateBadgeCache(design, currentCache.likes, currentCache.dislikes, newCommentCount);
        
        // Update the badge display
        const commentBadge = document.getElementById(`comments-${design}`);
        if (commentBadge) {
          commentBadge.textContent = newCommentCount;
        }
      }
    }
  }
}

// Render comments using cached data
async function renderComments(design) {
  const feedback = await getFeedbackDataFromCache(design);
  const comments = (feedback.comments || []).slice().reverse();

  designTitle.innerHTML = `${formatDesignName(design)}`;
  commentList.innerHTML = '<small>Comments</small>';

  if (comments.length === 0) {
    commentList.innerHTML = '<p style="color:#aaa;">No comments yet.</p>';
    return;
  }

  // Get current user to check if they can delete comments
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id;

  comments.forEach((comment, index) => {
    const div = document.createElement('div');
    div.className = 'comment';
    
    // Create username element
    const usernameSpan = document.createElement('span');
    usernameSpan.className = 'comment-username';
    usernameSpan.textContent = comment.username || 'Anonymous';
    
    // Create comment text element
    const textSpan = document.createElement('span');
    textSpan.className = 'comment-text';
    textSpan.textContent = comment.text;
    
    div.appendChild(usernameSpan);
    div.appendChild(textSpan);
    
    // Only show delete button if user is authenticated and this is their comment
    if (currentUserId && comment.user_id === currentUserId) {
      const deleteSpan = document.createElement('span');
      deleteSpan.className = 'delete-comment';
      deleteSpan.innerHTML = "<i class='fa-solid fa-trash-alt' title='Delete comment'></i>";
      
      // Add click event to delete comment
      deleteSpan.addEventListener('click', () => {
        deleteComment(design, index);
      });
      
      div.appendChild(deleteSpan);
    }
    
    commentList.appendChild(div);
  });
}

// Get designs for a specific theme
function getThemeDesigns(themeElement) {
  const designs = [];
  if (!themeElement) {
    return designs;
  }
  const thumbnails = themeElement.querySelectorAll('.thumbnail');
  thumbnails.forEach((thumb) => {
    designs.push({
      design: thumb.dataset.design,
      src: thumb.src
    });
  });
  return designs;
}

// Navigate to next design in slideshow (optimized with cached data)
async function nextDesign() {
  if (!currentThemeDesigns || currentThemeDesigns.length === 0) {
    return;
  }
  
  currentDesignIndex = (currentDesignIndex + 1) % currentThemeDesigns.length;
  const design = currentThemeDesigns[currentDesignIndex];
  
  if (!design) {
    return;
  }
  
  currentDesign = design.design;
  
  // Update voted state immediately before changing image
  updateVotedState();
  
  fullImage.src = design.src;
  
  // Use cached data for immediate response (synchronous)
  const feedback = getFeedbackDataFromCacheSync(currentDesign);
  
  // Update UI immediately with cached data
  designTitle.innerHTML = `${formatDesignName(currentDesign)}`;
  
  // Update comments immediately with cached data
  const comments = (feedback.comments || []).slice().reverse();
  commentList.innerHTML = '<small>Comments</small>';

  if (comments.length === 0) {
    commentList.innerHTML = '<p style="color:#aaa;">No comments yet.</p>';
  } else {
    // For designs with comments, we need to get user info for delete buttons
    // This is the only async operation needed
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id;

    comments.forEach((comment, index) => {
      const div = document.createElement('div');
      div.className = 'comment';
      
      const usernameSpan = document.createElement('span');
      usernameSpan.className = 'comment-username';
      usernameSpan.textContent = comment.username || 'Anonymous';
      
      const textSpan = document.createElement('span');
      textSpan.className = 'comment-text';
      textSpan.textContent = comment.text;
      
      div.appendChild(usernameSpan);
      div.appendChild(textSpan);
      
      if (currentUserId && comment.user_id === currentUserId) {
        const deleteSpan = document.createElement('span');
        deleteSpan.className = 'delete-comment';
        deleteSpan.innerHTML = "<i class='fa-solid fa-trash-alt' title='Delete comment'></i>";
        
        deleteSpan.addEventListener('click', () => {
          deleteComment(currentDesign, index);
        });
        
        div.appendChild(deleteSpan);
      }
      
      commentList.appendChild(div);
    });
  }
  
  // Update badges and sidebar counts with cached data
  const likeBadge = document.getElementById(`like-${currentDesign}`);
  const dislikeBadge = document.getElementById(`dislike-${currentDesign}`);
  const commentBadge = document.getElementById(`comments-${currentDesign}`);
  const sidebarLikeCount = document.getElementById('sidebarLikeCount');
  const sidebarDislikeCount = document.getElementById('sidebarDislikeCount');
  
  if (likeBadge) likeBadge.textContent = feedback.likes;
  if (dislikeBadge) dislikeBadge.textContent = feedback.dislikes;
  if (commentBadge) commentBadge.textContent = feedback.comments.length;
  if (sidebarLikeCount) sidebarLikeCount.textContent = feedback.likes;
  if (sidebarDislikeCount) sidebarDislikeCount.textContent = feedback.dislikes;
}

// Navigate to previous design in slideshow (optimized with cached data)
async function previousDesign() {
  if (!currentThemeDesigns || currentThemeDesigns.length === 0) {
    return;
  }
  
  currentDesignIndex = (currentDesignIndex - 1 + currentThemeDesigns.length) % currentThemeDesigns.length;
  const design = currentThemeDesigns[currentDesignIndex];
  
  if (!design) {
    return;
  }
  
  currentDesign = design.design;
  
  // Update voted state immediately before changing image
  updateVotedState();
  
  fullImage.src = design.src;
  
  // Use cached data for immediate response (synchronous)
  const feedback = getFeedbackDataFromCacheSync(currentDesign);
  
  // Update UI immediately with cached data
  designTitle.innerHTML = `${formatDesignName(currentDesign)}`;
  
  // Update comments immediately with cached data
  const comments = (feedback.comments || []).slice().reverse();
  commentList.innerHTML = '<small>Comments</small>';

  if (comments.length === 0) {
    commentList.innerHTML = '<p style="color:#aaa;">No comments yet.</p>';
  } else {
    // For designs with comments, we need to get user info for delete buttons
    // This is the only async operation needed
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id;

    comments.forEach((comment, index) => {
      const div = document.createElement('div');
      div.className = 'comment';
      
      const usernameSpan = document.createElement('span');
      usernameSpan.className = 'comment-username';
      usernameSpan.textContent = comment.username || 'Anonymous';
      
      const textSpan = document.createElement('span');
      textSpan.className = 'comment-text';
      textSpan.textContent = comment.text;
      
      div.appendChild(usernameSpan);
      div.appendChild(textSpan);
      
      if (currentUserId && comment.user_id === currentUserId) {
        const deleteSpan = document.createElement('span');
        deleteSpan.className = 'delete-comment';
        deleteSpan.innerHTML = "<i class='fa-solid fa-trash-alt' title='Delete comment'></i>";
        
        deleteSpan.addEventListener('click', () => {
          deleteComment(currentDesign, index);
        });
        
        div.appendChild(deleteSpan);
      }
      
      commentList.appendChild(div);
    });
  }
  
  // Update badges and sidebar counts with cached data
  const likeBadge = document.getElementById(`like-${currentDesign}`);
  const dislikeBadge = document.getElementById(`dislike-${currentDesign}`);
  const commentBadge = document.getElementById(`comments-${currentDesign}`);
  const sidebarLikeCount = document.getElementById('sidebarLikeCount');
  const sidebarDislikeCount = document.getElementById('sidebarDislikeCount');
  
  if (likeBadge) likeBadge.textContent = feedback.likes;
  if (dislikeBadge) dislikeBadge.textContent = feedback.dislikes;
  if (commentBadge) commentBadge.textContent = feedback.comments.length;
  if (sidebarLikeCount) sidebarLikeCount.textContent = feedback.likes;
  if (sidebarDislikeCount) sidebarDislikeCount.textContent = feedback.dislikes;
}

// Initialize event listeners for dynamically generated content
function initializeEventListeners() {
  // Thumbnail click → open lightbox and load comments
  document.querySelectorAll('.thumbnail').forEach((thumb) => {
    thumb.addEventListener('click', async () => {
      currentDesign = thumb.dataset.design;
      
      // Find the theme element containing this thumbnail
      // Try to find it in both direct and accordion structures
      let themeElement = thumb.closest('.theme');
      
      if (!themeElement) {
        // If not found directly, look in the round content
        const roundContent = thumb.closest('.round-content');
        
        if (roundContent) {
          // Look for the theme that contains this thumbnail
          const allThemes = roundContent.querySelectorAll('.theme');
          
          for (const theme of allThemes) {
            if (theme.contains(thumb)) {
              themeElement = theme;
              break;
            }
          }
        }
      }
      
      currentTheme = themeElement;
      
      // Get designs for this specific theme
      currentThemeDesigns = getThemeDesigns(themeElement);
      
      // Find the index of the clicked design within this theme
      currentDesignIndex = currentThemeDesigns.findIndex(d => d.design === currentDesign);
      
      // Update voted state immediately before showing lightbox
      updateVotedState();
      
      fullImage.src = thumb.src;
      lightbox.style.display = 'flex';
      
      // Use cached data for immediate response (synchronous)
      const feedback = getFeedbackDataFromCacheSync(currentDesign);
      
      // Update UI immediately with cached data
      designTitle.innerHTML = `${formatDesignName(currentDesign)}`;
      
      // Update comments immediately with cached data
      const comments = (feedback.comments || []).slice().reverse();
      commentList.innerHTML = '<small>Comments</small>';

      if (comments.length === 0) {
        commentList.innerHTML = '<p style="color:#aaa;">No comments yet.</p>';
      } else {
        // For designs with comments, we need to get user info for delete buttons
        // This is the only async operation needed
        const { data: { user } } = await supabase.auth.getUser();
        const currentUserId = user?.id;

        comments.forEach((comment, index) => {
          const div = document.createElement('div');
          div.className = 'comment';
          
          const usernameSpan = document.createElement('span');
          usernameSpan.className = 'comment-username';
          usernameSpan.textContent = comment.username || 'Anonymous';
          
          const textSpan = document.createElement('span');
          textSpan.className = 'comment-text';
          textSpan.textContent = comment.text;
          
          div.appendChild(usernameSpan);
          div.appendChild(textSpan);
          
          if (currentUserId && comment.user_id === currentUserId) {
            const deleteSpan = document.createElement('span');
            deleteSpan.className = 'delete-comment';
            deleteSpan.innerHTML = "<i class='fa-solid fa-trash-alt' title='Delete comment'></i>";
            
            deleteSpan.addEventListener('click', () => {
              deleteComment(currentDesign, index);
            });
            
            div.appendChild(deleteSpan);
          }
          
          commentList.appendChild(div);
        });
      }
      
      // Update badges and sidebar counts with cached data
      const likeBadge = document.getElementById(`like-${currentDesign}`);
      const dislikeBadge = document.getElementById(`dislike-${currentDesign}`);
      const commentBadge = document.getElementById(`comments-${currentDesign}`);
      const sidebarLikeCount = document.getElementById('sidebarLikeCount');
      const sidebarDislikeCount = document.getElementById('sidebarDislikeCount');
      
      if (likeBadge) likeBadge.textContent = feedback.likes;
      if (dislikeBadge) dislikeBadge.textContent = feedback.dislikes;
      if (commentBadge) commentBadge.textContent = feedback.comments.length;
      if (sidebarLikeCount) sidebarLikeCount.textContent = feedback.likes;
      if (sidebarDislikeCount) sidebarDislikeCount.textContent = feedback.dislikes;
    });
  });

  // Comment icon wrapper click → open lightbox (like clicking image)
  document.querySelectorAll('.comment-trigger').forEach((wrapper) => {
    wrapper.addEventListener('click', () => {
      const design = wrapper.dataset.design;
      const imgEl = Array.from(document.querySelectorAll('.thumbnail')).find(
        (img) => img.dataset.design === design
      );
      if (imgEl) imgEl.click();
    });
  });

  // Vote (like or dislike) click
  document.querySelectorAll('.feedback-icons i[data-type]').forEach((icon) => {
    icon.addEventListener('click', async () => {
      const design = icon.dataset.design;
      const voteType = icon.dataset.type; // "like" or "dislike"
      if (!design || !voteType) return;

      // Prevent multiple clicks while processing
      if (icon.classList.contains('processing')) return;
      
      // Add processing state to ALL voting icons for this design to prevent race conditions
      document.querySelectorAll(`[data-design="${design}"]`).forEach(el => {
        if (el.matches('.feedback-icons i[data-type]') || 
            el.matches('#lightboxLike, #lightboxDislike, #sidebarLike, #sidebarDislike')) {
          el.classList.add('processing');
        }
      });

      // Check if user is authenticated FIRST before any UI updates
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Show user-friendly message without changing anything
        alert('Please sign in with Google to vote on designs. Look for the "Sign in with Google" button in the top-right corner.');
        return;
      }

      // Get current vote state
      const currentVote = userVoteCache.get(design) || null;
      
      // Determine new vote state
      let newVote = null;
      if (currentVote === voteType) {
        // User clicked same button - remove vote
        newVote = null;
      } else {
        // User clicked different button - change vote
        newVote = voteType;
      }

      // Update UI immediately for responsiveness
      saveUserVote(design, newVote);
      updateVotedStateForDesign(design);
      
      // Update badge optimistically using cache data instead of DOM text
      const cachedBadges = badgeCache.get(design) || { likes: 0, dislikes: 0, comments: 0 };
      
      // Calculate new counts based on cache, not DOM
      let newLikes = cachedBadges.likes;
      let newDislikes = cachedBadges.dislikes;
      
      if (currentVote === 'like') {
        newLikes--;
      } else if (currentVote === 'dislike') {
        newDislikes--;
      }
      
      if (newVote === 'like') {
        newLikes++;
      } else if (newVote === 'dislike') {
        newDislikes++;
      }
      
      // Update badge cache first
      updateBadgeCache(design, newLikes, newDislikes, cachedBadges.comments);
      
      // Update DOM badges
      const likeBadge = document.getElementById(`like-${design}`);
      const dislikeBadge = document.getElementById(`dislike-${design}`);
      
      if (likeBadge) likeBadge.textContent = newLikes;
      if (dislikeBadge) dislikeBadge.textContent = newDislikes;

      // Submit vote to Supabase in background
      try {
        const success = await submitVote(design, voteType);
        if (!success) {
          // Revert changes if API call failed
          saveUserVote(design, currentVote);
          updateVotedStateForDesign(design);
          // Revert badge cache and DOM to original state
          updateBadgeCache(design, cachedBadges.likes, cachedBadges.dislikes, cachedBadges.comments);
          if (likeBadge) likeBadge.textContent = cachedBadges.likes;
          if (dislikeBadge) dislikeBadge.textContent = cachedBadges.dislikes;
          alert('Failed to submit vote. Please try again.');
        } else {
          // Vote was successful - ensure visual state is correct
          updateVotedStateForDesign(design);
        }
      } catch (error) {
        console.error('Error submitting vote:', error);
        // Revert changes on error
        saveUserVote(design, currentVote);
        updateVotedStateForDesign(design);
        // Revert badge cache and DOM to original state
        updateBadgeCache(design, cachedBadges.likes, cachedBadges.dislikes, cachedBadges.comments);
        if (likeBadge) likeBadge.textContent = cachedBadges.likes;
        if (dislikeBadge) dislikeBadge.textContent = cachedBadges.dislikes;
        alert('Error submitting vote. Please check your connection and try again.');
      } finally {
        // Remove processing state from ALL voting elements for this design
        document.querySelectorAll(`[data-design="${design}"]`).forEach(el => {
          if (el.matches('.feedback-icons i[data-type]') || 
              el.matches('#lightboxLike, #lightboxDislike, #sidebarLike, #sidebarDislike')) {
            el.classList.remove('processing');
          }
        });
        
        // Update theme stats in background
        setTimeout(() => {
          updateThemeStats();
        }, 100);
      }
    });
  });
}

// Submit new comment
submitCommentSidebar.addEventListener('click', async () => {
  const commentText = commentInputSidebar.value.trim();
  if (!commentText || !currentDesign) return;

  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    alert('Please sign in to comment');
    return;
  }

  // Submit comment to Supabase using authenticated user's name
  const success = await submitComment(currentDesign, commentText, user.user_metadata?.full_name || user.email);
  
  if (success) {
    commentInputSidebar.value = '';
    
    // Update global cache with new comment
    if (allFeedbackCache && allFeedbackCache[currentDesign]) {
      const newComment = {
        text: commentText,
        username: user.user_metadata?.full_name || user.email,
        timestamp: new Date().toISOString(),
        user_id: user.id
      };
      allFeedbackCache[currentDesign].comments.push(newComment);
    }
    
    renderComments(currentDesign);
    
    // Update badge cache immediately with new comment count
    const currentCache = badgeCache.get(currentDesign) || { likes: 0, dislikes: 0, comments: 0 };
    const newCommentCount = currentCache.comments + 1;
    updateBadgeCache(currentDesign, currentCache.likes, currentCache.dislikes, newCommentCount);
    
    // Update the badge display
    const commentBadge = document.getElementById(`comments-${currentDesign}`);
    if (commentBadge) {
      commentBadge.textContent = newCommentCount;
    }
  }
});

// Close lightbox
closeBtn.addEventListener('click', () => {
  lightbox.style.display = 'none';
  fullImage.src = '';
});

// Navigation buttons
document.getElementById('prevButton').addEventListener('click', () => {
  previousDesign();
});

document.getElementById('nextButton').addEventListener('click', () => {
  nextDesign();
});

// Lightbox feedback buttons
document.getElementById('lightboxLike').addEventListener('click', () => {
  if (currentDesign) {
    const icon = document.querySelector('.feedback-icons i[data-type="like"][data-design="' + currentDesign + '"]');
    if (icon) {
      icon.click(); // Trigger the existing like functionality
    }
  }
});

document.getElementById('lightboxDislike').addEventListener('click', () => {
  if (currentDesign) {
    const icon = document.querySelector('.feedback-icons i[data-type="dislike"][data-design="' + currentDesign + '"]');
    if (icon) {
      icon.click(); // Trigger the existing dislike functionality
    }
  }
});

// Sidebar voting buttons
document.getElementById('sidebarLike').addEventListener('click', () => {
  if (currentDesign) {
    const icon = document.querySelector('.feedback-icons i[data-type="like"][data-design="' + currentDesign + '"]');
    if (icon) {
      icon.click(); // Trigger the existing like functionality
    }
  }
});

document.getElementById('sidebarDislike').addEventListener('click', () => {
  if (currentDesign) {
    const icon = document.querySelector('.feedback-icons i[data-type="dislike"][data-design="' + currentDesign + '"]');
    if (icon) {
      icon.click(); // Trigger the existing dislike functionality
    }
  }
});

// Close lightbox by clicking background or pressing ESC
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) {
    lightbox.style.display = 'none';
    fullImage.src = '';
  }
});

document.addEventListener('keydown', (e) => {
  // Don't handle navigation keys if user is typing in a text input
  const activeElement = document.activeElement;
  const isTyping = activeElement && (
    activeElement.tagName === 'INPUT' || 
    activeElement.tagName === 'TEXTAREA' || 
    activeElement.contentEditable === 'true'
  );
  
  if (isTyping) {
    return; // Let the browser handle the keys normally for text inputs
  }
  
  if (e.key === 'Escape') {
    lightbox.style.display = 'none';
    fullImage.src = '';
  } else if (e.key === 'ArrowRight') {
    if (lightbox.style.display === 'flex') {
      nextDesign();
    }
  } else if (e.key === 'ArrowLeft') {
    if (lightbox.style.display === 'flex') {
      previousDesign();
    }
  }
});

// Clear user vote cache when user signs out
function clearUserVoteCache() {
  userVoteCache.clear();
  updateVotedState();
}

// Refresh user vote cache when user signs in
async function refreshUserVoteCache() {
  userVoteCache.clear();
  
  // Load all feedback data in one batch call
  const allFeedback = await getAllFeedback();
  
  // Update global cache
  allFeedbackCache = allFeedback;
  
  // Update user vote cache for all designs
  document.querySelectorAll('.feedback-icons i').forEach(icon => {
    const design = icon.dataset.design;
    if (design && allFeedback[design]) {
      userVoteCache.set(design, allFeedback[design].userVote);
    }
  });
  
  updateVotedState();
}

// Make functions globally available for supabase-config.js
window.refreshUserVoteCache = refreshUserVoteCache;
window.clearUserVoteCache = clearUserVoteCache;

// Initialize on load: badges, voted states, and design labels
window.addEventListener('DOMContentLoaded', async () => {
  // Check if Supabase is available
  if (typeof supabase === 'undefined') {
    console.error('Supabase is not loaded. Please check your internet connection and refresh the page.');
    return;
  }
  
  // Initialize auth state
  await checkAuthState();
  
  // Check admin status
  await checkAdminStatus();
  
  // Build rounds dynamically from folder structure
  await scanAssetsAndBuildRounds();
  
  // Load selected designs AFTER content is rendered
  await loadSelectedDesigns();
  
  // Initialize event listeners
  initializeEventListeners();

  // Load all feedback data in one batch call
  const allFeedback = await getAllFeedback();
  
  // Store in global cache for navigation
  allFeedbackCache = allFeedback;
  
  // Update badges and cache for all designs
  document.querySelectorAll('.feedback-icons i').forEach(icon => {
    const design = icon.dataset.design;
    if (design && allFeedback[design]) {
      const feedback = allFeedback[design];
      userVoteCache.set(design, feedback.userVote);
      
      // Update badge cache
      updateBadgeCache(design, feedback.likes, feedback.dislikes, feedback.comments.length);
      
      // Update badge display
      const likeBadge = document.getElementById(`like-${design}`);
      const dislikeBadge = document.getElementById(`dislike-${design}`);
      const commentBadge = document.getElementById(`comments-${design}`);
      
      if (likeBadge) likeBadge.textContent = feedback.likes;
      if (dislikeBadge) dislikeBadge.textContent = feedback.dislikes;
      if (commentBadge) commentBadge.textContent = feedback.comments.length;
      
      // Update sidebar vote counts if this is the current design
      if (currentDesign === design) {
        const sidebarLikeCount = document.getElementById('sidebarLikeCount');
        const sidebarDislikeCount = document.getElementById('sidebarDislikeCount');
        
        if (sidebarLikeCount) sidebarLikeCount.textContent = feedback.likes;
        if (sidebarDislikeCount) sidebarDislikeCount.textContent = feedback.dislikes;
      }
    }
  });

  // Ensure voted state is updated after userVoteCache is set
  updateVotedState();
  await updateThemeStats();
  
  // Update admin UI after dynamic content is loaded
  updateAdminUI();
});

// ==== Dynamic Folder-Based Round System ====
let roundsData = [];

// Scan assets folder and build rounds dynamically
async function scanAssetsAndBuildRounds() {
  try {
    // This would typically be done server-side, but for now we'll simulate
    // the folder structure based on the current assets
    const rounds = await detectRoundsFromAssets();
    roundsData = rounds;
    renderRoundsFromData();
  } catch (error) {
    console.error('Error scanning assets:', error);
  }
}

// Detect rounds from assets folder structure
async function detectRoundsFromAssets() {
  const rounds = [];
  const hasRound1 = hasAssetsInFolder('Round 1');
  const hasRound2 = hasAssetsInFolder('Round 2');
  const hasRound3 = hasAssetsInFolder('Round 3');

  // If we have multiple rounds, use accordion structure
  if (hasRound1 && (hasRound2 || hasRound3)) {
    if (hasRound2) {
      rounds.push({
        id: 'round2',
        name: 'Round 2',
        description: 'Refined options based on feedback from Round 1 - Vote on your favorites!',
        tags: ['Refined Options', 'Based on Feedback', 'Iterations'],
        isCurrent: true,
        isExpanded: true,
        themes: await getThemesFromFolder('Round 2')
      });
    }
    if (hasRound1) {
      rounds.push({
        id: 'round1',
        name: 'Round 1',
        description: 'Original design concepts - vote for your favorite hoodie designs!',
        tags: ['Initial Concepts', 'AI Generated', 'Multiple Themes'],
        isCurrent: false,
        isExpanded: false,
        themes: await getThemesFromFolder('Round 1')
      });
    }
    if (hasRound3) {
      rounds.push({
        id: 'round3',
        name: 'Round 3',
        description: 'Final candidates based on Round 2 voting - Choose your winner!',
        tags: ['Final Candidates', 'Top Performers', 'Winner Selection'],
        isCurrent: false,
        isExpanded: false,
        themes: await getThemesFromFolder('Round 3')
      });
    }
    
    return rounds.sort((a, b) => {
      // Sort by round number (extract number from name)
      const aNum = parseInt(a.name.match(/\d+/)?.[0] || 0);
      const bNum = parseInt(b.name.match(/\d+/)?.[0] || 0);
      return bNum - aNum; // Descending order (newest first)
    });
  } else if (hasRound1) {
    // Only Round 1 exists - display themes directly without accordion
    return [{
      id: 'direct',
      name: 'direct',
      description: 'direct',
      tags: [],
      isCurrent: true,
      isExpanded: true,
      themes: await getThemesFromFolder('Round 1'),
      isDirectDisplay: true
    }];
  }
  
  return rounds;
}

// Check if assets exist in a specific folder
function hasAssetsInFolder(folderName) {
  // This would check the actual folder structure
  // For now, we'll simulate based on current structure
  const folderMap = {
    'Round 1': true, // Has theme1, theme2, theme3, theme4, theme5
    'Round 2': true, // Has option1, option2
    'Round 3': false  // Does not exist yet
  };
  return folderMap[folderName] || false;
}

// Get themes from a specific folder
async function getThemesFromFolder(folderName) {
  const themes = [];
  if (folderName === 'Round 1') {
    // Dynamically detect theme folders inside Round 1
    // We'll use a helper to scan the folder structure (simulate for now)
    const themeFolders = ['theme1', 'theme2', 'theme3', 'theme4', 'theme5'];
    for (const theme of themeFolders) {
      // Simulate reading files in each theme folder
      let designFiles = [];
      if (theme === 'theme1') designFiles = ['Design 1.png', 'Design 2.png', 'Design 3.png', 'Design 4.png', 'Design 5.png'];
      if (theme === 'theme2') designFiles = ['design-1.png', 'design-2.png'];
      if (theme === 'theme3') designFiles = ['Design 1.png', 'Design 2.png', 'Design 3.png', 'Design 4.png', 'Design 5.png'];
      if (theme === 'theme4') designFiles = ['Design 1.png', 'Design 2.png', 'Design 3.png'];
      if (theme === 'theme5') designFiles = ['Design 1.png'];
      themes.push({
        name: theme.replace('theme', 'Theme '),
        designs: designFiles.map(file => ({
          id: `${theme}/${file}`,
          name: `${theme.replace('theme', 'Theme ')} - ${file.replace(/\.[^/.]+$/, '')}`,
          src: `assets/Round 1/${theme}/${file}`
        }))
      });
    }
  } else if (folderName === 'Round 2') {
    // Round 2 themes - these are selected designs for iteration
    const optionFolders = ['option1', 'option2'];
    for (const option of optionFolders) {
      // Use actual image files from the folders
      let designFiles = [];
      if (option === 'option1') designFiles = ['hoodie-front.png', 'hoodie-back.png'];
      if (option === 'option2') designFiles = ['hoodie-front.png', 'hoodie-back.jpg'];
      
      themes.push({
        name: option.replace('option', 'Option '),
        parentDesign: 'Selected from Round 1', // This indicates it's an iteration
        designs: designFiles.map(file => ({
          id: `${option}/${file}`,
          name: `${option.replace('option', 'Option ')} - ${file.replace(/\.[^/.]+$/, '')}`,
          src: `assets/Round 2/${option}/${file}`
        }))
      });
    }
  }
  return themes;
}

// Render rounds from data
function renderRoundsFromData() {
  const container = document.querySelector('body');
  const title = document.querySelector('h1');
  
  // Remove existing round sections and theme sections
  document.querySelectorAll('.round-section, .theme').forEach(section => section.remove());
  
  // Create a fragment to collect all rounds in correct order
  const fragment = document.createDocumentFragment();
  
  // Insert rounds after the title
  roundsData.forEach((round, index) => {
    if (round.isDirectDisplay) {
      // Direct display - render themes without round wrapper
      // Insert themes in correct order by using appendChild
      const themeFragment = document.createDocumentFragment();
      round.themes.forEach(theme => {
        const themeSection = createThemeSection(theme);
        themeFragment.appendChild(themeSection);
      });
      fragment.appendChild(themeFragment);
    } else {
      // Accordion display - render with round wrapper
      const roundSection = createRoundSection(round);
      fragment.appendChild(roundSection);
    }
  });
  
  // Insert all rounds at once in the correct order
  title.parentNode.insertBefore(fragment, title.nextSibling);
  
  // Reinitialize event listeners for the new content
  initializeEventListeners();
  
  // Update admin UI after content is rendered
  updateAdminUI();
}

// Create a theme section element (for direct display)
function createThemeSection(theme) {
  const section = document.createElement('div');
  section.className = 'theme';
  
  // Get theme metadata
  const themeMetadata = getThemeMetadata(theme.name);
  
  section.innerHTML = `
    <div class="theme-details">
      <h2>${theme.name}</h2>
      <div class="stats">
        <small><span class="design-count">${theme.designs.length}</span> designs </small>
         | <small>Most liked: <span class="design-most-liked">-</span></small> | <small>Most disliked: <span class="design-least-liked">-</span></small>
      </div>
    </div>

    <div class="design-wrapper">
      <div class="theme-description">
        <h3>${themeMetadata.description}</h3>
        <div class="tags">
          <span>Tags:</span>
          ${themeMetadata.tags.map(tag => `<div class="tag">${tag}</div>`).join('')}
        </div>
      </div>
      <div class="design-grid">
        ${theme.designs.map(design => createDesignHTML(design)).join('')}
      </div>
    </div>
  `;
  
  return section;
}

// Get theme metadata (descriptions and tags)
function getThemeMetadata(themeName) {
  const metadata = {
    'Theme 1': {
      description: 'Asked Chat GPT to look at our Pure Solutions website and suggest a design',
      tags: ['AI Generated', 'Website Inspired', 'Pure Solutions']
    },
    'Theme 2': {
      description: 'Bold colours with shapes and design-tool based design. "Build the Future" tagline carried over from previous design',
      tags: ['Bold Colors', 'Geometric Shapes', 'Build the Future']
    },
    'Theme 3': {
      description: 'Expanded on the pixel art generated from the first attempt and asked it to take Muizenberg beach scene.',
      tags: ['Code Meets Coast', 'Pixel Art', 'Muizenberg Beach']
    },
    'Theme 4': {
      description: 'Vibrant colors and geometric patterns for modern appeal',
      tags: ['Vibrant Colors', 'Geometric Patterns', 'Modern Appeal']
    },
    'Theme 5': {
      description: 'Elegant designs with sophisticated color palettes',
      tags: ['Elegant', 'Sophisticated', 'Color Palette']
    }
  };
  
  return metadata[themeName] || {
    description: 'Design theme with various concepts',
    tags: ['Design', 'Concept']
  };
}

// Create design HTML (for direct display)
function createDesignHTML(design) {
  const isSelected = selectedDesigns.has(design.id);
  const selectedClass = isSelected ? 'selected-design' : '';
  const selectionBadge = isSelected ? `
    <div class="selection-badge">
      <i class="fa-solid fa-check"></i>
      <span>SELECTED</span>
    </div>
  ` : '';
  
  return `
    <div class="design-item ${selectedClass}">
      ${selectionBadge}
      <p class="design-name"></p>
      <img
        src="${design.src}"
        alt="${design.name}"
        class="thumbnail"
        data-design="${design.id}" />

      <div class="feedback-icons">
        <div class="icon-wrapper">
          <i class="fa-regular fa-thumbs-up" data-type="like" data-design="${design.id}"></i>
          <span class="badge" id="like-${design.id}">0</span>
        </div>

        <div class="icon-wrapper">
          <i class="fa-regular fa-thumbs-down" data-type="dislike" data-design="${design.id}"></i>
          <span class="badge" id="dislike-${design.id}">0</span>
        </div>

        <div class="icon-wrapper comment-trigger" data-design="${design.id}">
          <i class="fa-regular fa-pen-to-square"></i>
          <span class="badge" id="comments-${design.id}">0</span>
        </div>
      </div>
    </div>
  `;
}

// Create a round section element (for accordion display)
function createRoundSection(round) {
  const section = document.createElement('div');
  section.className = 'round-section';
  
  const iconClass = round.isExpanded ? 'fa-chevron-down' : 'fa-chevron-right';
  const contentClass = round.isExpanded ? '' : 'collapsed';
  
  section.innerHTML = `
    <div class="round-header" onclick="toggleRound('${round.id}')">
      <div class="round-title">
        <i class="fa-solid ${iconClass} round-icon" id="${round.id}-icon"></i>
        <h2>${round.name}</h2>
      </div>
      <div class="round-stats">
        <small><span class="design-count">${getTotalDesigns(round)}</span> designs</small>
        <small>${round.isCurrent ? 'Current stage' : 'Previous stage'}</small>
      </div>
    </div>
    
    <div class="round-content ${contentClass}" id="${round.id}-content">
      ${round.themes.map(theme => {
        const themeSection = createThemeSection(theme);
        return themeSection.outerHTML;
      }).join('')}
    </div>
  `;
  
  return section;
}

// Create theme HTML (for accordion display)
function createThemeHTML(theme, round) {
  return theme.designs.map(design => {
    const isSelected = selectedDesigns.has(design.id);
    const selectedClass = isSelected ? 'selected-design' : '';
    const selectionBadge = isSelected ? `
      <div class="selection-badge">
        <i class="fa-solid fa-check"></i>
        <span>SELECTED</span>
      </div>
    ` : '';
    
    const iterationBadge = theme.parentDesign ? `
      <div class="iteration-badge">
        <i class="fa-solid fa-arrow-up"></i>
        <span>Based on ${theme.parentDesign}</span>
      </div>
    ` : '';
    
    return `
      <div class="design-item ${selectedClass}">
        ${selectionBadge}
        <p class="design-name">${design.name}</p>
        <img
          src="${design.src}"
          alt="${design.name}"
          class="thumbnail"
          data-design="${design.id}" />
        <div class="feedback-icons">
          <div class="icon-wrapper">
            <i class="fa-regular fa-thumbs-up" data-type="like" data-design="${design.id}"></i>
            <span class="badge" id="like-${design.id}">0</span>
          </div>
          <div class="icon-wrapper">
            <i class="fa-regular fa-thumbs-down" data-type="dislike" data-design="${design.id}"></i>
            <span class="badge" id="dislike-${design.id}">0</span>
          </div>
          <div class="icon-wrapper comment-trigger" data-design="${design.id}">
            <i class="fa-regular fa-pen-to-square"></i>
            <span class="badge" id="comments-${design.id}">0</span>
          </div>
        </div>
        ${iterationBadge}
      </div>
    `;
  }).join('');
}

// Get total designs in a round
function getTotalDesigns(round) {
  return round.themes.reduce((total, theme) => total + theme.designs.length, 0);
}

// ==== Admin Selection Functionality ====
let isAdminUser = false;
let selectedDesigns = new Set();

// Check admin status and update UI
async function checkAdminStatus() {
  try {
    isAdminUser = await isUserAdmin();
    updateAdminUI();
  } catch (error) {
    console.error('Error checking admin status:', error);
    isAdminUser = false;
  }
}

// Update UI based on admin status
function updateAdminUI() {
  const designItems = document.querySelectorAll('.design-item');
  
  designItems.forEach(item => {
    const checkbox = item.querySelector('.admin-checkbox');
    const selectionBadge = item.querySelector('.selection-badge');
    
    if (isAdminUser) {
      // Show checkbox for admin users
      if (!checkbox) {
        createAdminCheckbox(item);
      }
      if (selectionBadge) {
        selectionBadge.style.display = 'none';
      }
    } else {
      // Show selection badge for regular users
      if (checkbox) {
        checkbox.remove();
      }
      if (selectionBadge) {
        selectionBadge.style.display = 'flex';
      }
    }
  });
}

// Create admin checkbox for a design item
function createAdminCheckbox(designItem) {
  const designId = designItem.querySelector('.thumbnail')?.dataset.design;
  if (!designId) return;
  
  // Remove existing checkbox if any
  const existingCheckbox = designItem.querySelector('.admin-checkbox');
  if (existingCheckbox) {
    existingCheckbox.remove();
  }
  
  // Create checkbox
  const checkbox = document.createElement('div');
  checkbox.className = 'admin-checkbox';
  checkbox.innerHTML = `
    <label class="checkbox-label">
      <input type="checkbox" data-design="${designId}">
      <span class="checkbox-text">Mark for iteration</span>
    </label>
  `;
  
  // Add event listener
  const input = checkbox.querySelector('input');
  input.addEventListener('change', async (e) => {
    const selected = e.target.checked;
    const success = await markDesignForIteration(designId, selected);
    
    if (success) {
      if (selected) {
        selectedDesigns.add(designId);
        designItem.classList.add('selected-design');
      } else {
        selectedDesigns.delete(designId);
        designItem.classList.remove('selected-design');
      }
    } else {
      // Revert checkbox state if operation failed
      e.target.checked = !selected;
    }
  });
  
  // Check if design is already selected (use the loaded selections)
  if (selectedDesigns.has(designId)) {
    input.checked = true;
    designItem.classList.add('selected-design');
  }
  
  // Insert checkbox at the top of the design item
  designItem.insertBefore(checkbox, designItem.firstChild);
}

// Load selected designs and update UI
async function loadSelectedDesigns() {
  try {
    const selections = await getSelectedDesigns();
    selectedDesigns.clear();
    
    selections.forEach(selection => {
      selectedDesigns.add(selection.design_id);
    });
    
    // Update visual state of selected designs
    document.querySelectorAll('.design-item').forEach(item => {
      const designId = item.querySelector('.thumbnail')?.dataset.design;
      if (designId && selectedDesigns.has(designId)) {
        item.classList.add('selected-design');
      } else {
        item.classList.remove('selected-design');
      }
    });
  } catch (error) {
    console.error('Error loading selected designs:', error);
  }
}

// ==== Round Accordion Functionality ====
function toggleRound(roundId) {
  const content = document.getElementById(`${roundId}-content`);
  const icon = document.getElementById(`${roundId}-icon`);
  
  if (content && icon) {
    const isCollapsed = content.classList.contains('collapsed');
    
    if (isCollapsed) {
      // Expand the round
      content.classList.remove('collapsed');
      icon.classList.add('expanded');
      icon.classList.remove('fa-chevron-right');
      icon.classList.add('fa-chevron-down');
    } else {
      // Collapse the round
      content.classList.add('collapsed');
      icon.classList.remove('expanded');
      icon.classList.remove('fa-chevron-down');
      icon.classList.add('fa-chevron-right');
    }
  }
}

// Make toggleRound function globally available
window.toggleRound = toggleRound;