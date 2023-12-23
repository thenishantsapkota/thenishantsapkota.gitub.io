#!/bin/bash

# Generate a random number between 0 and 400
hue=$(shuf -i 0-400 -n 1)

# Replace the hue color in the CSS file
sed -i "s/--hue-color: .*/--hue-color: $hue;/" styles.css

# Add the changes to git
git add styles.css

# Commit the changes
git commit -m "Update hue color"

# Push the changes
git push origin main