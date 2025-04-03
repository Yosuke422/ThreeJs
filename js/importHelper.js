/**
 * Import Helper
 * This file provides functions to import Three.js modules and related loaders
 * to help work around path issues.
 */

import * as THREE from 'three';

// Export Three.js directly
export { THREE };

// Async function to import FBXLoader
export async function loadFBXLoader() {
  try {
    // Try the canonical path first
    return await import('three/examples/jsm/loaders/FBXLoader.js')
      .then(module => module.FBXLoader);
  } catch (err) {
    console.warn("Failed to load FBXLoader from examples/jsm path:", err);
    
    try {
      // Try the addons path as fallback
      return await import('three/addons/loaders/FBXLoader.js')
        .then(module => module.FBXLoader);
    } catch (err2) {
      console.error("Failed to load FBXLoader from addons path:", err2);
      
      // Try absolute CDN path as last resort
      try {
        return await import('https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/loaders/FBXLoader.js')
          .then(module => module.FBXLoader);
      } catch (err3) {
        console.error("All attempts to load FBXLoader failed:", err3);
        throw new Error("Unable to load FBXLoader from any source");
      }
    }
  }
}

// Function to load an FBX file with error handling
export async function loadFBXModel(path) {
  try {
    const FBXLoader = await loadFBXLoader();
    const loader = new FBXLoader();
    
    return new Promise((resolve, reject) => {
      loader.load(
        path,
        (fbx) => {
          console.log(`Successfully loaded FBX model: ${path}`);
          resolve(fbx);
        },
        (xhr) => {
          console.log(`${path} loading: ${(xhr.loaded / xhr.total * 100).toFixed(2)}%`);
        },
        (error) => {
          console.error(`Error loading FBX model ${path}:`, error);
          reject(error);
        }
      );
    });
  } catch (err) {
    console.error("Failed to initialize FBXLoader:", err);
    throw err;
  }
} 