"""Perform code manipulation before and after build"""

import subprocess
import os

class RenameTask:
    def __init__(self, old_name, new_name):
        self.old_name = old_name
        self.new_name = new_name
        self.need_cleanup = False

    def execute(self):
        if os.path.exists(self.old_name):
            os.rename(self.old_name, self.new_name)
            self.need_cleanup = True
    
    def cleanup(self):
        if self.need_cleanup:
            os.rename(self.new_name, self.old_name)


def pre_build(tasks):
    print(">>> Intializing >>>")
    for task in tasks:
        task.execute()

def post_build(tasks):
    
    for task in tasks:
        task.cleanup()
    print("<<< Cleanup Done <<<")

def build():
    result = subprocess.run(["make", "-C", "build", "-f", "../config/build.mk"])
    return result.returncode

if __name__ == "__main__":
    tasks = [
        RenameTask("libs/exlaunch/source/program/main.cpp", "libs/exlaunch/source/program/main.cpp.old"),
        RenameTask("libs/exlaunch/source/program/setting.hpp", "libs/exlaunch/source/program/setting.hpp.old")
    ]
    pre_build(tasks)
    returncode = build()
    post_build(tasks)
    exit(returncode)