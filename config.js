// Configuration file for Design Review Board
// Edit this file to customize your themes and settings

module.exports = {
  // Theme descriptions and tags - add your custom descriptions and tags here
  themeDescriptions: {
    'theme1': 'Asked Chat GPT to look at our Pure Solutions website and suggest a design',
    'theme2': 'Bold colours with shapes and design-tool based design. "Build the Future" tagline carried over from previous design',
    'theme3': 'Expanded on the pixel art generated from the first attempt and asked it to take Muizenberg beach scene.',
    'theme4': 'Vibrant colors and geometric patterns for modern appeal',
    'theme5': 'Elegant designs with sophisticated color palettes',
    // Add more themes as needed
  },

  // Theme tags - add tags for each theme
  themeTags: {
    'theme1': ['AI Generated', 'Website Inspired', 'Pure Solutions'],
    'theme2': ['Bold Colors', 'Geometric Shapes', 'Build the Future'],
    'theme3': ['Code Meets Coast', 'Pixel Art', 'Muizenberg Beach'],
    'theme4': ['Vibrant Colors', 'Geometric Patterns', 'Modern Appeal'],
    'theme5': ['Elegant', 'Sophisticated', 'Color Palette'],
    // Add more themes as needed
  },

  // Default description for themes not listed above
  defaultDescription: 'Design collection with unique style and creative elements',

  // Supported image file extensions
  supportedExtensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp'],

  // Theme name formatting rules
  themeNameFormat: {
    // Convert "theme1" to "Theme 1"
    pattern: /theme(\d+)/i,
    replacement: (match, num) => `Theme ${num}`,
    
    // Additional formatting for other naming patterns
    // Add more patterns as needed
  },

  // Page title
  pageTitle: 'Design Review Board',

  // Build settings
  build: {
    // Sort themes alphabetically
    sortThemes: true,
    
    // Sort images alphabetically within each theme
    sortImages: true,
    
    // Show file extensions in design names (false = hide extensions)
    showExtensions: false
  }
}; 