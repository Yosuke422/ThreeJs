# 3D Maze Runner

A 3D maze game built with Three.js featuring modern UI, coin collection, and various environment themes.

## Development

To run the development server:

```bash
# Install dependencies
npm install

# Start dev server with Vite (hot reloading)
npm run dev
```

## Production Server

This project includes an Express server for production use:

```bash
# Run the Express server
npm start
```

The server will automatically find an available port starting from 3000.

## Production Build

To create a production build:

```bash
# Build the project
npm run build

# Preview the production build locally
npm run preview
```

## Deployment to Render

This project is configured for easy deployment to [Render](https://render.com/).

### Manual Deployment Steps

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Use the following settings:
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Node Version**: 18.x or later

### Using render.yaml (Blueprint)

Alternatively, you can use the included `render.yaml` file to deploy as a Blueprint:

1. Push the code to GitHub
2. Go to Render Dashboard → New → Blueprint
3. Connect your repository
4. Render will automatically configure your service based on the render.yaml file

## Controls

- **W, A, S, D**: Move around the maze
- **Mouse**: Look around
- **Space**: Jump over obstacles
- **Shift**: Sprint (run faster)

## Features

- Multiple theme environments (Forest, Desert, Cave, Ice, Volcano, etc.)
- Coin collection system
- Hazards and traps
- Progressive levels
- Modern UI with animations
- First-person gameplay

## License

ISC 