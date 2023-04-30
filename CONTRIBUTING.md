# Contributing to browser-image-resizer

## Overview

Thanks for helping to shake out any issues with this library! The setup is very small, but I figured I'd outline your typical build environment should you choose to contribute.

## Development Environment

### Prerequisites

- Node.js 14.16.0 and above

### Setup

1. Clone this repo
1. `pnpm install`
1. `pnpm run dev` to run a webpack-dev-server + babel which will autoreload the library on changes

### Symlinking

To test this locally on a web app of your choosing, you'll want to symlink this library in your NPM. That way, any changes locally can be reflected in your test app.

1. `cd tests/vite-project`
1. Execute `pnpm install`
1. Execute `pnpm link ../..`

Now any changes (via `pnpm run dev` above) will be reflected in the test web app that ships with this library.

### EXIF Data in iOS

When using a specific camera setting in iOS, EXIF data gets stripped by default: https://stackoverflow.com/questions/57942150/file-upload-and-exif-in-mobile-safari

In order for this to work, a user will need to change their iOS camera settings to "Most Compatible" as below:

![image](https://user-images.githubusercontent.com/6023705/87861285-d2b6a180-c912-11ea-9c44-d29c784cb783.png)
