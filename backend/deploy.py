#!/usr/bin/env python3
"""
Simple deployment script for the Globe backend
"""

import os
import sys
import subprocess
from pathlib import Path

def check_requirements():
    """Check if all required files exist"""
    required_files = [
        'requirements.txt',
        'app_production.py',
        'helpers.py'
    ]
    
    missing_files = []
    for file in required_files:
        if not Path(file).exists():
            missing_files.append(file)
    
    if missing_files:
        print(f"❌ Missing required files: {missing_files}")
        return False
    
    print("✅ All required files found")
    return True

def check_env_vars():
    """Check if environment variables are set"""
    required_vars = ['COPERNICUS_USERNAME', 'COPERNICUS_PASSWORD']
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"⚠️  Missing environment variables: {missing_vars}")
        print("Please set these in your deployment platform")
        return False
    
    print("✅ Environment variables configured")
    return True

def test_app():
    """Test if the app can start"""
    try:
        # Test import
        from app_production import app
        print("✅ App imports successfully")
        return True
    except Exception as e:
        print(f"❌ App import failed: {e}")
        return False

def main():
    print("🚀 Globe Backend Deployment Check")
    print("=" * 40)
    
    checks = [
        check_requirements,
        check_env_vars,
        test_app
    ]
    
    all_passed = True
    for check in checks:
        if not check():
            all_passed = False
        print()
    
    if all_passed:
        print("✅ All checks passed! Ready for deployment.")
        print("\n📋 Next steps:")
        print("1. Deploy to Render/Railway/Heroku")
        print("2. Set environment variables in your deployment platform")
        print("3. Update frontend environment variables in Vercel")
    else:
        print("❌ Some checks failed. Please fix the issues above.")
        sys.exit(1)

if __name__ == "__main__":
    main() 