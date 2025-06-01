# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/455e0a6f-ee5a-40db-8ecd-33a3db235133

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/455e0a6f-ee5a-40db-8ecd-33a3db235133) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Development Tools and Debugging

This project includes several tools to help with development and debugging:

### Development Helper Script

A `dev-tools.sh` script is included for common development tasks:

```sh
# Make the script executable (if not already)
chmod +x dev-tools.sh

# Available commands
./dev-tools.sh start         # Start the development server
./dev-tools.sh build         # Build the application
./dev-tools.sh lint          # Run linter
./dev-tools.sh clear-storage # Get script to clear localStorage
./dev-tools.sh fix-progress  # Fix progress data issues in localStorage
./dev-tools.sh help          # Show help
```

### Debug Panel

When running in development mode, the application includes a debug panel accessible from the header. This provides:

- View of current progress state
- Ability to clear storage data
- Step progress information in collapsible sections

### Progress Data Structure

The application properly initializes step progress data with the following fields:

- `status`: Current step status ('not_started', 'in_progress', 'started', 'complete', or 'error')
- `success`: Whether the step was completed successfully (boolean)
- `conversationStatus`: Status of the conversation ('not_started', 'processing', 'success', etc.)

These fields ensure proper rendering and state management throughout the application.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/455e0a6f-ee5a-40db-8ecd-33a3db235133) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
