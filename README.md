# Design Review Board

An automated design review board that dynamically generates sections for each theme folder in your assets directory. Users can view, like, dislike, and comment on designs.

## Features

- **Automatic Theme Detection**: Creates sections for each folder in the `assets` directory
- **Interactive Feedback**: Like, dislike, and comment on designs
- **Lightbox View**: Click any design to view it full-size with comments
- **Persistent Storage**: All feedback is saved in localStorage
- **Theme Statistics**: Shows most and least liked designs for each theme
- **Responsive Design**: Works on desktop and mobile devices

## Quick Start

1. **Organize your designs** in the `assets` folder:
   ```
   assets/
   ├── theme1/
   │   ├── Design 1.png
   │   ├── Design 2.png
   │   └── Design 3.png
   ├── theme2/
   │   ├── design-1.png
   │   └── design-2.png
   └── theme3/
       ├── concept-a.png
       └── concept-b.png
   ```

2. **Build the HTML**:
   ```bash
   npm run build
   ```

3. **Open in browser**:
   - Open `index.html` in your browser
   - Or run `npm run dev` to start a local server

## Usage

### Adding New Themes

1. Create a new folder in the `assets` directory (e.g., `theme4`)
2. Add your design images to the folder
3. Run `npm run build` to regenerate the HTML
4. The new theme will automatically appear with all functionality

### Supported Image Formats

- PNG
- JPG/JPEG
- GIF
- WebP

### Customizing Theme Descriptions

Edit the `getThemeDescription()` function in `build.js` to add custom descriptions for your themes:

```javascript
function getThemeDescription(themeName) {
  const descriptions = {
    'theme1': 'Classic designs with modern elements and clean aesthetics',
    'theme2': 'Bold colours with shapes and design-tool based design',
    'theme3': 'Minimalist approach with focus on typography',
    // Add your custom descriptions here
  };
  return descriptions[themeName.toLowerCase()] || 'Design collection with unique style and creative elements';
}
```

## Development

### Available Scripts

- `npm run build` - Generate the HTML file
- `npm run watch` - Watch for changes in assets folder and rebuild automatically
- `npm run dev` - Build and start a local server

### File Structure

```
├── assets/           # Your design folders go here
├── build.js         # Build script that generates HTML
├── script.js        # JavaScript functionality
├── style.css        # Styling
├── index.html       # Generated HTML (don't edit manually)
├── package.json     # Project configuration
└── README.md        # This file
```

## How It Works

1. **Build Process**: The `build.js` script scans the `assets` directory for folders
2. **HTML Generation**: Creates HTML sections for each theme with all necessary elements
3. **Dynamic Content**: JavaScript handles all interactions and updates
4. **Local Storage**: Feedback is persisted in the browser's localStorage

## Customization

### Styling
Edit `style.css` to customize the appearance of your design review board.

### Functionality
Modify `script.js` to add new features or change existing behavior.

### Build Process
Customize `build.js` to change how themes are named, described, or organized.

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers

## License

MIT License - feel free to use and modify as needed. 