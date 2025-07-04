const fs = require('fs');
const path = require('path');
const config = require('./config.js');

// Function to format theme name using config
function formatThemeName(folderName) {
  let formattedName = folderName;
  
  // Apply pattern replacement from config
  if (config.themeNameFormat.pattern) {
    formattedName = formattedName.replace(config.themeNameFormat.pattern, config.themeNameFormat.replacement);
  }
  
  // Apply additional formatting
  formattedName = formattedName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
    
  return formattedName;
}

// Function to get theme description and tags from config
function getThemeDescription(themeName) {
  const description = config.themeDescriptions[themeName.toLowerCase()] || config.defaultDescription;
  const tags = config.themeTags[themeName.toLowerCase()] || [];
  
  return { description, tags };
}

// Function to generate HTML for a single design item
function generateDesignItem(imagePath, designName, themeFolder) {
  // Create unique identifier by combining theme folder and design name
  const uniqueId = `${themeFolder}/${designName}`;
  
  return `
          <div class="design-item">
            <p class="design-name"></p>
            <img
              src="${imagePath}"
              alt="${designName}"
              class="thumbnail"
              data-design="${uniqueId}" />

            <div class="feedback-icons">
              <div class="icon-wrapper">
                <i
                  class="fa-regular fa-thumbs-up"
                  data-type="like"
                  data-design="${uniqueId}"></i>
                <span class="badge" id="like-${uniqueId}">0</span>
              </div>

              <div class="icon-wrapper">
                <i
                  class="fa-regular fa-thumbs-down"
                  data-type="dislike"
                  data-design="${uniqueId}"></i>
                <span class="badge" id="dislike-${uniqueId}">0</span>
              </div>

              <div
                class="icon-wrapper comment-trigger"
                data-design="${uniqueId}">
                <i class="fa-regular fa-pen-to-square"></i>
                <span class="badge" id="comments-${uniqueId}">0</span>
              </div>
            </div>
          </div>`;
}

// Function to generate HTML for a theme section
function generateThemeSection(themeFolder, images) {
  const themeName = formatThemeName(themeFolder);
  const themeData = getThemeDescription(themeFolder);
  
  const designItems = images.map(image => {
    const imagePath = `assets/${themeFolder}/${image}`;
    return generateDesignItem(imagePath, image, themeFolder);
  }).join('\n');

  // Generate tags HTML if tags exist
  const tagsHTML = themeData.tags.length > 0 ? `
          <div class="tags">
            <span>Tags:</span>
            ${themeData.tags.map(tag => `<div class="tag">${tag}</div>`).join('\n            ')}
          </div>` : '';

  return `
    <div class="theme">
      <div class="theme-details">
        <h2>${themeName}</h2>
        <div class="stats">
          <small><span class="design-count">${images.length}</span> ${images.length === 1 ? 'design' : 'designs'} </small>
          ${images.length > 1 ? ` | <small>Most liked: <span class="design-most-liked">-</span></small> | <small>Most disliked: <span class="design-least-liked">-</span></small>` : ''}
        </div>
      </div>

      <div class="design-wrapper">
        <div class="theme-description">
          <h3>${themeData.description}</h3>${tagsHTML}
        </div>
        <div class="design-grid">
${designItems}
        </div>
      </div>
    </div>`;
}

// Function to scan assets directory and get all themes
function scanAssetsDirectory() {
  const assetsPath = path.join(__dirname, 'assets');
  const themes = [];
  
  if (!fs.existsSync(assetsPath)) {
    console.error('Assets directory not found!');
    return themes;
  }

  const themeFolders = fs.readdirSync(assetsPath, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
    
  // Sort themes if enabled in config
  if (config.build.sortThemes) {
    themeFolders.sort();
  }

  themeFolders.forEach(themeFolder => {
    const themePath = path.join(assetsPath, themeFolder);
    const images = fs.readdirSync(themePath)
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return config.supportedExtensions.includes(ext);
      });
      
    // Sort images if enabled in config
    if (config.build.sortImages) {
      images.sort();
    }
    
    if (images.length > 0) {
      themes.push({
        folder: themeFolder,
        images: images
      });
    }
  });

  return themes;
}

// Function to generate the complete HTML
function generateHTML(themes) {
  const themeSections = themes.map(theme => 
    generateThemeSection(theme.folder, theme.images)
  ).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${config.pageTitle}</title>
    <link rel="stylesheet" href="style.css" />
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" />
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="supabase-config.js"></script>
    <script src="supabase-api.js"></script>
  </head>
  <body>

    <!-- Authentication Container -->
    <div id="authContainer" class="auth-container"></div>

${themeSections}

    <!-- Lightbox -->
    <div id="lightbox">
      <div class="lightbox-content">
        <div class="image-wrapper">
          <div class="lightbox-header">
            <button id="lightboxClose" title="Close">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <button id="prevButton" class="nav-button prev-button" title="Previous">
            <i class="fa-solid fa-chevron-left"></i>
          </button>
          <img id="fullImage" src="" alt="Full View" />
          <button id="nextButton" class="nav-button next-button" title="Next">
            <i class="fa-solid fa-chevron-right"></i>
          </button>
          
          <!-- Lightbox feedback buttons -->
          <div class="lightbox-feedback">
            <button id="lightboxLike" class="feedback-btn like-btn" title="Like">
              <i class="fa-regular fa-thumbs-up"></i>
            </button>
            <button id="lightboxDislike" class="feedback-btn dislike-btn" title="Dislike">
              <i class="fa-regular fa-thumbs-down"></i>
            </button>
          </div>
        </div>
        <div id="commentSidebar">
          <div class="sidebar-header">
            <h4 id="designTitle">Comments</h4>
            <div class="sidebar-voting">
              <div class="vote-item">
                <i class="fa-regular fa-thumbs-up sidebar-vote-icon" id="sidebarLike"></i>
                <span class="sidebar-vote-count" id="sidebarLikeCount">0</span>
              </div>
              <div class="vote-item">
                <i class="fa-regular fa-thumbs-down sidebar-vote-icon" id="sidebarDislike"></i>
                <span class="sidebar-vote-count" id="sidebarDislikeCount">0</span>
              </div>
            </div>
          </div>
          <div id="commentList"></div>
          <div class="sidebar-footer">
            <textarea
              id="commentInputSidebar"
              placeholder="Add a comment..."></textarea>
            <button id="submitCommentSidebar">Send</button>
          </div>
        </div>
      </div>
    </div>

    <script src="script.js"></script>
  </body>
</html>`;
}

// Main execution
function main() {
  console.log('🔍 Scanning assets directory...');
  const themes = scanAssetsDirectory();
  
  if (themes.length === 0) {
    console.log('❌ No theme folders found in assets directory');
    return;
  }

  console.log(`📁 Found ${themes.length} theme(s):`);
  themes.forEach(theme => {
    console.log(`   - ${theme.folder}: ${theme.images.length} images`);
  });

  console.log('📝 Generating HTML...');
  const html = generateHTML(themes);
  
  fs.writeFileSync('index.html', html);
  console.log('✅ HTML generated successfully!');
  console.log('🚀 You can now open index.html in your browser');
}

// Run the build
main(); 