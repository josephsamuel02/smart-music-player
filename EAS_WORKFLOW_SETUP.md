# EAS Workflows - Automatic Production Updates

This document explains the EAS Workflows setup for automatic OTA (Over-The-Air) updates.

## 📋 What This Does

When you push code to the `main` branch on GitHub, EAS automatically:
1. Detects the push
2. Publishes an OTA update to the production channel
3. Makes the update available to all users with the app installed

## 📁 File Created

**Location:** `.eas/workflows/production-update.yml`

```yaml
name: Production Update

on:
  push:
    branches: ['main']

jobs:
  publish_update:
    name: Publish Update
    type: update
    params:
      channel: production
      message: "Auto update from ${{ github.event.head_commit.message }}"
```

## 🚀 Setup Instructions

### 1. Push the workflow file to GitHub:

```bash
git add .eas/workflows/production-update.yml
git commit -m "Add EAS auto-publish workflow"
git push origin main
```

### 2. Verify the workflow is active:

After pushing, check:
- Go to your EAS dashboard: https://expo.dev/accounts/mrsam_1/projects/smart-music-player
- Click on "Workflows" tab
- You should see "Production Update" workflow listed

### 3. Test the workflow:

Make a small change and push to main:
```bash
# Make a small change
echo "# Test" >> README.md
git add README.md
git commit -m "Test EAS workflow"
git push origin main
```

Check the workflow status in the EAS dashboard.

## 📊 How It Works

### Workflow Trigger:
```yaml
on:
  push:
    branches: ['main']
```
- Runs automatically when code is pushed to `main` branch
- Does NOT run on other branches (feature branches, dev, etc.)

### Job Configuration:
```yaml
jobs:
  publish_update:
    name: Publish Update
    type: update  # This is an OTA update, not a build
    params:
      channel: production  # Updates go to production channel
      message: "Auto update from ${{ github.event.head_commit.message }}"
```

### What Gets Updated:
- ✅ JavaScript/TypeScript code changes
- ✅ React Native component changes
- ✅ Images and assets
- ✅ Configuration changes (if supported by OTA)

### What Does NOT Get Updated (Requires New Build):
- ❌ Native code changes (Android/iOS)
- ❌ New native dependencies
- ❌ Changes to app.json that affect native code
- ❌ Expo SDK version upgrades

## 🔄 Update Flow

```
Developer pushes to main
        ↓
GitHub webhook triggers
        ↓
EAS Workflows starts
        ↓
EAS builds update bundle
        ↓
Update published to production channel
        ↓
Users' apps check for updates
        ↓
Users download and apply update
```

## 📱 User Experience

### When Update is Available:
- App checks for updates on launch
- Downloads update in background
- Applies update on next app restart (or immediately, depending on config)

### Update Configuration:
Check your `app.json` for update settings:
```json
"updates": {
  "url": "https://u.expo.dev/ff995805-37c3-4fe4-b6df-afc9a9c535d8"
}
```

## 🔐 Security & Permissions

### Required Permissions:
- EAS needs access to your GitHub repository
- Already configured via your EAS project setup

### Authentication:
- Uses your EAS credentials (already set up)
- No additional authentication needed

## 📋 Best Practices

### 1. Use Branch Protection:
Protect your `main` branch to prevent accidental pushes:
```bash
# On GitHub:
# Settings → Branches → Add rule for 'main'
# - Require pull request reviews
# - Require status checks to pass
```

### 2. Test Before Merging:
- Always test on a feature branch first
- Merge to `main` only after thorough testing
- Consider a staging workflow for pre-production testing

### 3. Meaningful Commit Messages:
The commit message is shown in the update:
```bash
# Good
git commit -m "Fix: Resolve crash when playing large files"

# Bad
git commit -m "fix"
```

### 4. Monitor Updates:
- Check EAS dashboard after pushing
- Verify update was published successfully
- Monitor error reports from users

## 🎯 Additional Workflows (Optional)

### Staging Workflow:
Create `.eas/workflows/staging-update.yml` for testing:
```yaml
name: Staging Update

on:
  push:
    branches: ['staging']

jobs:
  publish_update:
    name: Publish Staging Update
    type: update
    params:
      channel: staging
      message: "Staging: ${{ github.event.head_commit.message }}"
```

### Pull Request Preview:
Create `.eas/workflows/pr-preview.yml` for PR previews:
```yaml
name: PR Preview

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  preview_update:
    name: Preview Update
    type: update
    params:
      channel: pr-${{ github.event.pull_request.number }}
      message: "PR #${{ github.event.pull_request.number }}: ${{ github.event.pull_request.title }}"
```

## 🐛 Troubleshooting

### Workflow Not Triggering:
1. Check GitHub webhook is configured
2. Verify you pushed to `main` branch
3. Check EAS dashboard for errors

### Update Not Reaching Users:
1. Verify update was published (check EAS dashboard)
2. Check app's update configuration in app.json
3. Ensure users are on a compatible build

### Build Fails:
1. Check workflow logs in EAS dashboard
2. Verify all dependencies are installed
3. Test update locally: `eas update --branch production`

## 📚 Useful Commands

### Manual Update (Bypass Workflow):
```bash
# Publish to production manually
eas update --branch production --message "Manual update"

# Publish to staging
eas update --branch staging --message "Testing feature"
```

### Check Update Status:
```bash
# View recent updates
eas update:list --branch production

# View workflow runs
eas workflow:list
```

### Rollback Update:
```bash
# Republish a previous update
eas update:republish --group <update-group-id>
```

## 🔗 Resources

- [EAS Workflows Documentation](https://docs.expo.dev/eas/workflows/)
- [EAS Update Documentation](https://docs.expo.dev/eas-update/introduction/)
- [Your EAS Dashboard](https://expo.dev/accounts/mrsam_1/projects/smart-music-player)

## ✅ Checklist

After setup, verify:
- [ ] Workflow file committed and pushed to GitHub
- [ ] Workflow appears in EAS dashboard
- [ ] Test push triggers workflow successfully
- [ ] Update reaches test devices
- [ ] Users can receive and apply updates

---

## 🎉 Setup Complete!

Your app now has automatic OTA updates! Every push to `main` will deploy a new version to all your users automatically.

**Next Steps:**
1. Push the workflow file to GitHub
2. Make a test change and push to main
3. Check EAS dashboard to verify workflow ran
4. Test the update on a device