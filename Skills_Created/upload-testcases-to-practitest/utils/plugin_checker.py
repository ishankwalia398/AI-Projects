"""
PractiTest Plugin Checker and Installer
Ensures the PractiTest plugin is available before upload
"""

import subprocess
import sys
from typing import Tuple, Optional


class PluginChecker:
    """
    Checks for PractiTest plugin availability and installs if needed
    """

    PLUGIN_NAME = "practitest@kalt-ai-plugins"
    PLUGIN_INSTALL_COMMAND = "/plugin install practitest@kalt-ai-plugins"

    @staticmethod
    def check_plugin_available() -> Tuple[bool, Optional[str]]:
        """
        Check if PractiTest plugin is available

        Returns:
            Tuple of (is_available, error_message)
            - (True, None) if plugin is available
            - (False, error_message) if plugin is not available
        """
        try:
            # Try importing the MCP tool to check availability
            # This is a heuristic - we check if practitest tools are callable
            import inspect
            import sys

            # Check if any practitest MCP functions are in the global namespace
            # or if we can call them
            # This is environment-specific and may need adjustment

            # Try to get the list of available MCP tools
            # In Claude Code, MCP tools are available as functions
            # with the pattern: mcp__plugin_practitest_practitest__*

            # Simple check: see if we can reference the function
            try:
                # Attempt to get a reference to a known PractiTest MCP function
                list_projects_func = eval('mcp__plugin_practitest_practitest__list_projects')
                return True, None
            except NameError:
                return False, "PractiTest MCP tools not found in namespace"

        except Exception as e:
            return False, f"Error checking plugin: {str(e)}"

    @staticmethod
    def install_plugin() -> Tuple[bool, str]:
        """
        Attempt to install the PractiTest plugin

        Returns:
            Tuple of (success, message)
        """
        try:
            # Try using subprocess to run the plugin install command
            # Note: This may not work in all environments
            result = subprocess.run(
                ["claude", "plugin", "install", PluginChecker.PLUGIN_NAME],
                capture_output=True,
                text=True,
                timeout=60
            )

            if result.returncode == 0:
                return True, "Plugin installed successfully. Please restart Claude Code."
            else:
                error_msg = result.stderr if result.stderr else "Unknown error"
                return False, f"Installation failed: {error_msg}"

        except subprocess.TimeoutExpired:
            return False, "Installation timed out after 60 seconds"
        except FileNotFoundError:
            return False, "Could not find 'claude' command. May need to install manually."
        except Exception as e:
            return False, f"Installation error: {str(e)}"

    @staticmethod
    def ensure_plugin_available() -> Tuple[bool, str]:
        """
        Ensure plugin is available, installing if needed

        Returns:
            Tuple of (ready_to_use, message)
            - (True, message) if plugin is available and ready
            - (False, message) if plugin is not available or installation failed
        """
        # Check if plugin is already available
        is_available, error_msg = PluginChecker.check_plugin_available()

        if is_available:
            return True, "PractiTest plugin is available"

        # Plugin not available, try to install
        print("⚠️  PractiTest plugin not detected")
        print(f"   Reason: {error_msg}")
        print("\nAttempting to install plugin...")

        success, install_msg = PluginChecker.install_plugin()

        if success:
            return False, (
                "✅ PractiTest plugin installed successfully!\n\n"
                "⚠️  IMPORTANT: You must restart Claude Code for the plugin to become available.\n\n"
                "After restarting, please run this skill again."
            )
        else:
            return False, (
                f"❌ Could not install PractiTest plugin automatically.\n\n"
                f"   Reason: {install_msg}\n\n"
                f"Please install manually by running:\n"
                f"  {PluginChecker.PLUGIN_INSTALL_COMMAND}\n\n"
                f"After installation, restart Claude Code and try again."
            )

    @staticmethod
    def get_manual_install_instructions() -> str:
        """
        Get manual installation instructions for the user

        Returns:
            String with installation instructions
        """
        return f"""
To install the PractiTest plugin manually:

1. Run the following command in Claude Code:
   {PluginChecker.PLUGIN_INSTALL_COMMAND}

2. Wait for the installation to complete

3. Restart Claude Code

4. Run this skill again

For more information about plugins, run: /help plugins
"""


def check_and_install_plugin() -> bool:
    """
    Convenience function to check and install plugin with user-friendly output

    Returns:
        True if plugin is ready to use, False otherwise
    """
    ready, message = PluginChecker.ensure_plugin_available()

    print(message)

    if not ready:
        print("\n" + PluginChecker.get_manual_install_instructions())

    return ready


# Example usage
if __name__ == "__main__":
    """
    Test the plugin checker
    """
    print("Checking PractiTest plugin availability...\n")

    if check_and_install_plugin():
        print("\n✅ Plugin is ready! You can proceed with the upload.")
        sys.exit(0)
    else:
        print("\n❌ Plugin is not ready. Follow the instructions above.")
        sys.exit(1)
