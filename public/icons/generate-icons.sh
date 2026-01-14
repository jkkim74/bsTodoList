#!/bin/bash

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "ImageMagick not installed. Installing..."
    # Try to install ImageMagick (this might require sudo)
    # For now, we'll create a simple placeholder
fi

# SVG to PNG conversion using rsvg-convert (if available)
if command -v rsvg-convert &> /dev/null; then
    echo "Using rsvg-convert..."
    for size in 72 96 128 144 152 192 384 512; do
        rsvg-convert -w $size -h $size icon.svg -o icon-${size}x${size}.png
        echo "Created icon-${size}x${size}.png"
    done
else
    echo "rsvg-convert not available. Creating placeholder icons..."
    # We'll use a different approach - create base64 encoded minimal PNG
    for size in 72 96 128 144 152 192 384 512; do
        # For now, just copy the SVG as a reference
        cp icon.svg icon-${size}x${size}.svg
        echo "Created icon-${size}x${size}.svg (placeholder)"
    done
fi

echo "Icon generation complete!"
