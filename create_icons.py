import os
import base64

# Base64 encoded 1x1 green transparent PNG (a simple placeholder)
# Actually, let's use a 1x1 solid green square.
b64_img = b"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgG2Sn6+AAAAAElFTkSuQmCC"

# Create the icons directory
os.makedirs("extension/icons", exist_ok=True)

img_data = base64.b64decode(b64_img)

# Write out the three icon sizes
for size in [16, 48, 128]:
    with open(f"extension/icons/icon{size}.png", "wb") as f:
        f.write(img_data)

print("Icons generated successfully.")
