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
let currentUsername = localStorage.getItem('username') || null; // Get stored username

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
  // This function is kept for compatibility but will be replaced with specific API calls
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
  }
}

// Delete a comment
async function deleteComment(design, commentIndex) {
  if (confirm('Are you sure you want to delete this comment?')) {
    const feedback = await getFeedbackData(design);
    if (feedback.comments && feedback.comments[commentIndex]) {
      const comment = feedback.comments[commentIndex];
      
      // Delete from Supabase
      const success = await deleteCommentFromSupabase(design, comment.text, comment.username);
      
      if (success) {
        // Re-render comments and update badges
        renderComments(design);
        updateBadges(design);
      }
    }
  }
}

// Render all comments for the current design
async function renderComments(design) {
  const feedback = await getFeedbackData(design);
  const comments = (feedback.comments || []).slice().reverse();

  designTitle.textContent = `Comments - ${formatDesignName(design)}`;
  commentList.innerHTML = '';

  if (comments.length === 0) {
    commentList.innerHTML = '<p style="color:#aaa;">No comments yet.</p>';
    return;
  }

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
    
    // Create comment delete element
    const deleteSpan = document.createElement('span');
    deleteSpan.className = 'delete-comment';
    deleteSpan.innerHTML = "<i class='fa-solid fa-trash-alt' title='Delete comment'></i>";
    
    // Add click event to delete comment
    deleteSpan.addEventListener('click', () => {
      deleteComment(design, index);
    });
    
    div.appendChild(deleteSpan);
    div.appendChild(usernameSpan);
    div.appendChild(textSpan);
    commentList.appendChild(div);
  });
}

// Get designs for a specific theme
function getThemeDesigns(themeElement) {
  const designs = [];
  const thumbnails = themeElement.querySelectorAll('.thumbnail');
  thumbnails.forEach((thumb) => {
    designs.push({
      design: thumb.dataset.design,
      src: thumb.src
    });
  });
  return designs;
}

// Navigate to next design in slideshow
async function nextDesign() {
  currentDesignIndex = (currentDesignIndex + 1) % currentThemeDesigns.length;
  const design = currentThemeDesigns[currentDesignIndex];
  currentDesign = design.design;
  
  // Update voted state immediately before changing image
  updateVotedState();
  
  fullImage.src = design.src;
  await renderComments(currentDesign);
  await updateBadges(currentDesign);
}

// Navigate to previous design in slideshow
async function previousDesign() {
  currentDesignIndex = (currentDesignIndex - 1 + currentThemeDesigns.length) % currentThemeDesigns.length;
  const design = currentThemeDesigns[currentDesignIndex];
  currentDesign = design.design;
  
  // Update voted state immediately before changing image
  updateVotedState();
  
  fullImage.src = design.src;
  await renderComments(currentDesign);
  await updateBadges(currentDesign);
}

// Initialize event listeners for dynamically generated content
function initializeEventListeners() {
  // Thumbnail click → open lightbox and load comments
  document.querySelectorAll('.thumbnail').forEach((thumb) => {
    thumb.addEventListener('click', async () => {
      currentDesign = thumb.dataset.design;
      
      // Find the theme element containing this thumbnail
      const themeElement = thumb.closest('.theme');
      currentTheme = themeElement;
      
      // Get designs for this specific theme
      currentThemeDesigns = getThemeDesigns(themeElement);
      
      // Find the index of the clicked design within this theme
      currentDesignIndex = currentThemeDesigns.findIndex(d => d.design === currentDesign);
      
      // Update voted state immediately before showing lightbox
      updateVotedState();
      
      fullImage.src = thumb.src;
      lightbox.style.display = 'flex';
      await renderComments(currentDesign);
      await updateBadges(currentDesign);
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
      icon.classList.add('processing');

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
      
      // Update badge optimistically
      const likeBadge = document.getElementById(`like-${design}`);
      const dislikeBadge = document.getElementById(`dislike-${design}`);
      
      if (likeBadge && dislikeBadge) {
        const currentLikes = parseInt(likeBadge.textContent) || 0;
        const currentDislikes = parseInt(dislikeBadge.textContent) || 0;
        
        // Calculate new counts
        let newLikes = currentLikes;
        let newDislikes = currentDislikes;
        
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
        
        likeBadge.textContent = newLikes;
        dislikeBadge.textContent = newDislikes;
        
        // Update badge cache
        updateBadgeCache(design, newLikes, newDislikes, parseInt(document.getElementById(`comments-${design}`)?.textContent) || 0);
      }

      // Submit vote to Supabase in background
      try {
        const success = await submitVote(design, voteType);
        if (!success) {
          // Revert changes if API call failed
          saveUserVote(design, currentVote);
          updateVotedStateForDesign(design);
          if (likeBadge && dislikeBadge) {
            likeBadge.textContent = currentLikes || 0;
            dislikeBadge.textContent = currentDislikes || 0;
          }
          console.error('Vote submission failed, reverted changes');
        }
      } catch (error) {
        console.error('Error submitting vote:', error);
        // Revert changes on error
        saveUserVote(design, currentVote);
        updateVotedStateForDesign(design);
        if (likeBadge && dislikeBadge) {
          likeBadge.textContent = currentLikes || 0;
          dislikeBadge.textContent = currentDislikes || 0;
        }
      } finally {
        // Remove processing state
        icon.classList.remove('processing');
        
        // Update theme stats in background
        setTimeout(() => {
          updateThemeStats();
        }, 100);
      }
    });
  });
}

// Show username input if not set
function showUsernameInput() {
  const username = prompt('Please enter your username (this will be saved for future comments):', currentUsername || '');
  if (username && username.trim()) {
    currentUsername = username.trim();
    localStorage.setItem('username', currentUsername);
    return true;
  }
  return false;
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

  // Submit comment to Supabase using authenticated user
  const success = await submitComment(currentDesign, commentText, user.user_metadata?.full_name || user.email);
  
  if (success) {
    commentInputSidebar.value = '';
    renderComments(currentDesign);
    updateBadges(currentDesign);
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

// Change username button
document.getElementById('changeUsername').addEventListener('click', () => {
  showUsernameInput();
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
  
  // Reload all user votes for the new user
  const designs = new Set();
  document.querySelectorAll('.feedback-icons i').forEach(icon => {
    const design = icon.dataset.design;
    if (design) designs.add(design);
  });
  
  for (const design of designs) {
    const feedback = await getFeedbackData(design);
    userVoteCache.set(design, feedback.userVote);
  }
  
  updateVotedState();
}

// Initialize on load: badges, voted states, and design labels
window.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM Content Loaded - Initializing app...');
  
  // Check if Supabase is available
  if (typeof supabase === 'undefined') {
    console.error('Supabase is not loaded. Please check your internet connection and refresh the page.');
    return;
  }
  
  console.log('Supabase is available, proceeding with initialization...');
  
  // Initialize auth state
  await checkAuthState();
  
  // Set thumbnail names from file
  document.querySelectorAll('.design-item').forEach((item) => {
    const img = item.querySelector('.thumbnail');
    const label = item.querySelector('.design-name');
    if (img && label) {
      const filename = img.dataset.design;
      label.textContent = formatDesignName(filename);
    }
  });

  // Initialize event listeners
  initializeEventListeners();

  // Set initial badges and vote states
  console.log('Loading initial data...');
  
  // Load all designs into cache first
  const designs = new Set();
  document.querySelectorAll('.feedback-icons i').forEach(icon => {
    const design = icon.dataset.design;
    if (design) designs.add(design);
  });
  
  // Pre-load user votes for all designs
  for (const design of designs) {
    const feedback = await getFeedbackData(design);
    userVoteCache.set(design, feedback.userVote);
    await updateBadges(design);
  }

  updateVotedState();
  await updateThemeStats();
  
  console.log('App initialization complete!');
});
