#!/usr/bin/env python3
"""
Script to update CORS domains in the backend configuration
"""

import re
import sys
from pathlib import Path

def update_cors_domains(new_domain):
    """Update CORS domains in app_production.py"""
    
    app_file = Path("app_production.py")
    if not app_file.exists():
        print("❌ app_production.py not found")
        return False
    
    # Read the file
    with open(app_file, 'r') as f:
        content = f.read()
    
    # Check if domain already exists
    if new_domain in content:
        print(f"✅ Domain {new_domain} already exists in CORS configuration")
        return True
    
    # Add the new domain to the allowed_origins list
    pattern = r'(allowed_origins = \[[^\]]*)(\])'
    replacement = f'\\1,\n    "{new_domain}",  # Added automatically\\2'
    
    new_content = re.sub(pattern, replacement, content)
    
    if new_content == content:
        print("❌ Could not find allowed_origins list to update")
        return False
    
    # Write the updated content
    with open(app_file, 'w') as f:
        f.write(new_content)
    
    print(f"✅ Added {new_domain} to CORS configuration")
    return True

def main():
    if len(sys.argv) != 2:
        print("Usage: python update_cors.py <domain>")
        print("Example: python update_cors.py https://my-app.vercel.app")
        sys.exit(1)
    
    domain = sys.argv[1]
    
    # Validate domain format
    if not domain.startswith(('http://', 'https://')):
        print("❌ Domain must start with http:// or https://")
        sys.exit(1)
    
    if update_cors_domains(domain):
        print("\n📋 Next steps:")
        print("1. Commit and push the changes")
        print("2. Redeploy your backend")
        print("3. Test the connection from your frontend")
    else:
        sys.exit(1)

if __name__ == "__main__":
    main() 