# Node Version Compatibility Fix

## Issue
React Native 0.78.0 has compatibility issues with Node.js v22.x. The error "Cannot read properties of undefined (reading 'handle')" occurs because the `connect` module used by Metro bundler is not compatible with Node 22.

## Solution

### Option 1: Use Node Version Manager (Recommended)
Install and use Node 18 or 20:

```bash
# Install nvm if you don't have it
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node 20 (LTS)
nvm install 20
nvm use 20

# Or install Node 18
nvm install 18
nvm use 18

# Verify version
node --version  # Should show v18.x.x or v20.x.x
```

### Option 2: Use the .nvmrc file
If you have nvm installed, the project includes a `.nvmrc` file:

```bash
nvm use
```

### Option 3: Manual Node Installation
Download and install Node.js 18 LTS or 20 LTS from [nodejs.org](https://nodejs.org/)

## After Switching Node Versions

1. Clear all caches:
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
```

2. Reinstall dependencies:
```bash
npm install --legacy-peer-deps
```

3. Start Metro:
```bash
npm start -- --reset-cache
```

## Current Setup
- **React Native**: 0.78.0
- **Recommended Node**: 18.x or 20.x (LTS)
- **Current Node**: Check with `node --version`
- **Gradle**: 8.12 (configured in `android/gradle/wrapper/gradle-wrapper.properties`)

