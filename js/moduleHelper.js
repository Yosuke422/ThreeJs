/**
 * Module Helper
 * This file assists with ES module imports by providing fallback paths if needed
 */

// Check if Three.js modules can be loaded from node_modules
export async function ensureModulesAvailable() {
  console.log('Checking module availability...');
  
  // Try to use the import map first
  try {
    const { Object3D } = await import('three');
    
    // Test FBXLoader specifically since it's causing the issues
    try {
      const { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader.js');
      console.log('FBXLoader imported successfully from import map');
    } catch (fbxErr) {
      console.warn('FBXLoader import failed:', fbxErr.message);
      // Update import map to explicitly map FBXLoader
      updateImportMap({
        'three': 'https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js',
        'three/addons/': 'https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/',
        'three/examples/jsm/loaders/FBXLoader.js': 'https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/loaders/FBXLoader.js',
        'three/examples/jsm/': 'https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/'
      });
    }
    
    if (Object3D) {
      console.log('Three.js modules loaded successfully from import map');
      return true;
    }
  } catch (err) {
    console.warn('Could not load Three.js from import map, trying fallbacks');
  }
  
  // Try loading from CDN directly
  try {
    const { Object3D } = await import('https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js');
    if (Object3D) {
      console.log('Three.js modules loaded successfully from CDN');
      
      // Override the import map for CDN with all necessary paths
      updateImportMap({
        'three': 'https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js',
        'three/addons/': 'https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/',
        'three/examples/jsm/loaders/FBXLoader.js': 'https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/loaders/FBXLoader.js',
        'three/examples/jsm/': 'https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/'
      });
      
      return true;
    }
  } catch (err) {
    console.error('Failed to load Three.js from CDN:', err);
  }
  
  // Try loading from node_modules directly
  try {
    const { Object3D } = await import('/node_modules/three/build/three.module.js');
    if (Object3D) {
      console.log('Three.js modules loaded successfully from node_modules');
      
      // Override the import map for node_modules
      updateImportMap({
        'three': '/node_modules/three/build/three.module.js',
        'three/addons/': '/node_modules/three/examples/jsm/',
        'three/examples/jsm/loaders/FBXLoader.js': '/node_modules/three/examples/jsm/loaders/FBXLoader.js',
        'three/examples/jsm/': '/node_modules/three/examples/jsm/'
      });
      
      return true;
    }
  } catch (err) {
    console.error('Failed to load Three.js from all sources:', err);
    return false;
  }
  
  return false;
}

// Helper to update the import map
function updateImportMap(imports) {
  try {
    let importMapElement = document.querySelector('script[type="importmap"]');
    if (!importMapElement) {
      importMapElement = document.createElement('script');
      importMapElement.type = 'importmap';
      document.head.appendChild(importMapElement);
    }
    
    const importMap = { imports };
    importMapElement.textContent = JSON.stringify(importMap);
    console.log('Import map updated with new paths');
  } catch (mapErr) {
    console.warn('Could not update import map:', mapErr);
  }
}

// Export a function to handle loading modules
export async function getThreeModule() {
  await ensureModulesAvailable();
  return import('three');
}

// Add a specific function for importing the FBXLoader
export async function getFBXLoader() {
  await ensureModulesAvailable();
  return import('three/examples/jsm/loaders/FBXLoader.js')
    .then(module => module.FBXLoader)
    .catch(err => {
      console.error('Error importing FBXLoader:', err);
      throw err;
    });
} 