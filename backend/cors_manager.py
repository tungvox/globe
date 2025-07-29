#!/usr/bin/env python3
"""
Comprehensive CORS management for the Globe backend
"""

import os
import re
from pathlib import Path

class CORSManager:
    def __init__(self, app_file="app_production.py"):
        self.app_file = Path(app_file)
        self.domains_file = Path("cors_domains.txt")
        
    def load_current_domains(self):
        """Load current domains from the app file"""
        if not self.app_file.exists():
            return []
        
        with open(self.app_file, 'r') as f:
            content = f.read()
        
        # Extract domains from allowed_origins list
        pattern = r'"https://([^"]+)"'
        domains = re.findall(pattern, content)
        return [f"https://{domain}" for domain in domains]
    
    def add_domain(self, domain):
        """Add a new domain to CORS configuration"""
        if not domain.startswith(('http://', 'https://')):
            domain = f"https://{domain}"
        
        current_domains = self.load_current_domains()
        
        if domain in current_domains:
            print(f"✅ Domain {domain} already exists")
            return True
        
        # Read the file
        with open(self.app_file, 'r') as f:
            content = f.read()
        
        # Find the allowed_origins list and add the new domain
        pattern = r'(allowed_origins = \[[^\]]*)(\])'
        replacement = f'\\1,\n    "{domain}",  # Added automatically\\2'
        
        new_content = re.sub(pattern, replacement, content)
        
        if new_content == content:
            print("❌ Could not find allowed_origins list")
            return False
        
        # Write the updated content
        with open(self.app_file, 'w') as f:
            f.write(new_content)
        
        print(f"✅ Added {domain} to CORS configuration")
        return True
    
    def list_domains(self):
        """List all current CORS domains"""
        domains = self.load_current_domains()
        print("📋 Current CORS domains:")
        for i, domain in enumerate(domains, 1):
            print(f"  {i}. {domain}")
        return domains
    
    def remove_domain(self, domain):
        """Remove a domain from CORS configuration"""
        if not domain.startswith(('http://', 'https://')):
            domain = f"https://{domain}"
        
        # Read the file
        with open(self.app_file, 'r') as f:
            content = f.read()
        
        # Remove the domain line
        pattern = rf'\s*"{re.escape(domain)}",\s*#.*\n'
        new_content = re.sub(pattern, '', content)
        
        if new_content == content:
            print(f"❌ Domain {domain} not found")
            return False
        
        # Write the updated content
        with open(self.app_file, 'w') as f:
            f.write(new_content)
        
        print(f"✅ Removed {domain} from CORS configuration")
        return True
    
    def generate_vercel_domains(self):
        """Generate common Vercel domain patterns"""
        base_domains = [
            "globe-pi-six.vercel.app",
            "globe-6d4elgnr0-tungvoxs-projects.vercel.app",
            "globe-jvaox3vb4-tungvoxs-projects.vercel.app",
            "globe-d7f6cmn3t-tungvoxs-projects.vercel.app"
        ]
        
        return [f"https://{domain}" for domain in base_domains]

def main():
    import sys
    
    manager = CORSManager()
    
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python cors_manager.py add <domain>")
        print("  python cors_manager.py list")
        print("  python cors_manager.py remove <domain>")
        print("  python cors_manager.py vercel")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "add" and len(sys.argv) == 3:
        domain = sys.argv[2]
        if manager.add_domain(domain):
            print("\n📋 Next steps:")
            print("1. Commit and push the changes")
            print("2. Redeploy your backend")
            print("3. Test the connection")
    
    elif command == "list":
        manager.list_domains()
    
    elif command == "remove" and len(sys.argv) == 3:
        domain = sys.argv[2]
        manager.remove_domain(domain)
    
    elif command == "vercel":
        print("🔧 Adding common Vercel domains...")
        domains = manager.generate_vercel_domains()
        for domain in domains:
            manager.add_domain(domain)
        print("\n✅ Added all common Vercel domains")
    
    else:
        print("❌ Invalid command or missing arguments")
        sys.exit(1)

if __name__ == "__main__":
    main() 