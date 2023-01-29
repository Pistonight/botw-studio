"""
FTP command line wrapper

Usage: python ftp.py ip port commands ...
Commands:
    send file/tree:   STOR local_path remote_path
    get file:         RETR remote_path local_path
    get tree:         RTTR remote_directory local_directory
    delete file:      DELE remote_path
    delete tree:      RMD  remote_directory
    rename file/tree: RNME old_remote_path new_remote_path


"""
# Usage: ftpUtil.py command ip
from ftplib import FTP, all_errors
from os import makedirs, listdir
from os.path import join, isfile, isdir
import sys


def run(ip, port, commands):
    """Main"""
    ftpw = FtpWrapper(ip, int(port))
    ftpw.connect()
    cmd_iter = iter(commands)
    while True:
        try:
            cmd = next(cmd_iter)
        except StopIteration:
            break
        if cmd == "STOR":
            local_path = next(cmd_iter)
            remote_path = next(cmd_iter)
            ftpw.ensure_parent(remote_path)
            if isfile(local_path):
                ftpw.send_file(local_path, remote_path)
            else:
                ftpw.send_directory(local_path, remote_path)
        elif cmd == "RETR":
            remote_path = next(cmd_iter)
            local_path = next(cmd_iter)
            ftpw.retrive_file(local_path, remote_path)
        elif cmd == "RTTR":
            remote_path = next(cmd_iter)
            local_path = next(cmd_iter)
            ftpw.ensure_path(remote_path)
            ftpw.retrive_directory(local_path, remote_path)
        elif cmd == "DELE":
            remote_path = next(cmd_iter)
            ftpw.delete_file(remote_path)
        elif cmd == "RMD":
            remote_path = next(cmd_iter)
            ftpw.delete_directory(remote_path)
        elif cmd == "RNME":
            old_path = next(cmd_iter)
            new_path = next(cmd_iter)
            ftpw.rename(old_path, new_path)
        else:
            print("Unknown command:", cmd)
            sys.exit(-1)

    print("All Done")


# Clean
def clean(ftpw, ftp_config):
    """Remove deployment on console"""
    for file in ftp_config["file"]:
        ftpw.delete_file(file["target"])

# Get crash report
def report(ftpw, ftp_config):
    """Download crash reports and delete them on console"""
    crash_report_dir = ftp_config["crash_reports"]
    ftpw.ensure_path(crash_report_dir)
    ftpw.retrive_directory("crash_reports", crash_report_dir)
    ftpw.delete_directory(crash_report_dir)

class FtpWrapper:
    """Wrapper for ftp"""
    def __init__(self, host, port):
        """Constructor"""
        self.ftp = FTP()
        self.host = host
        self.port = port

    def connect(self):
        """Connect"""
        print(f'Connecting to {self.host}:{self.port}... ', end='')
        self.ftp.connect(self.host, self.port)
        print('Connected!')

    def listcontent(self,remote_path):
        """Returns directories, files"""
        file_list, dirs, nondirs = [], [], []
        if not self.cwd(remote_path):
            return [], []

        self.ftp.retrlines('LIST', lambda x: file_list.append(x.split()))
        for info in file_list:
            ls_type, name = info[0], info[-1]
            if ls_type.startswith('d'):
                dirs.append(name)
            else:
                nondirs.append(name)
        return dirs, nondirs

    def ensure_parent(self, path_to_file):
        """Ensure parent of the path to file exists"""
        directories = path_to_file.split("/")[:-1]
        self.ensure_path_array(directories)

    def ensure_path(self, path):
        """Ensure directory exists"""
        directories = path.split("/")
        self.ensure_path_array(directories)

    def ensure_path_array(self,path_array):
        """Iteratively make sure path exists"""
        if len(path_array) == 0 or (len(path_array)==1 and path_array[0]=="/"):
            return

        cur_root = "/"
        index = 0
        if path_array[0] == "/":
            self.ensure_from_root("/", path_array[1])
            cur_root = join(cur_root, path_array[1])
            index = 2
        else:
            self.ensure_from_root("/", path_array[0])
            cur_root = join(cur_root, path_array[0])
            index = 1

        while index < len(path_array):
            self.ensure_from_root(cur_root, path_array[index])
            cur_root = join(cur_root, path_array[index])
            index+=1

    def ensure_from_root(self, root, path):
        """If path is not a directory under root, make one"""
        directories, _ = self.listcontent(root)
        if path not in directories:
            print(f"MKD {join(root, path)}")
            self.ftp.mkd(f'{root}/{path}')

    def send_file(self, local_path, remote_path):
        """Send local_path to remote_path"""
        remote_path = add_slash_if_need(remote_path)
        if not isfile(local_path):
            print("Error: ", local_path, " does not exist or is not a file")
            sys.exit(-1)
        print(f'STOR {local_path} --> {remote_path}')
        with open(local_path, 'rb') as local_file:
            self.ftp.storbinary(f'STOR {remote_path}', local_file)

    def send_directory(self, local_path, remote_path):
        "Recursively upload directory"
        if not isdir(local_path):
            print("Error: ", local_path, " does not exist or is not a directory")
            sys.exit(-1)
        for sub_path in listdir(local_path):
            full_path = join(local_path, sub_path)
            if isfile(full_path):
                self.send_file(full_path, join(remote_path, sub_path))
            else:
                self.send_directory(full_path, join(remote_path, sub_path))

    def delete_file(self, remote_path):
        """Delete remote_path"""
        remote_path = add_slash_if_need(remote_path)
        try:
            self.ftp.delete(remote_path)
            print(f'DELE {remote_path}')
        except all_errors:
            return

    def delete_directory(self, remote_path):
        """Recursively delete directory"""
        remote_path = add_slash_if_need(remote_path)
        directories, files = self.listcontent(remote_path)
        for directory in directories:
            self.delete_directory(join(remote_path, directory))
        for file in files:
            self.delete_file(join(remote_path, file))

        print(f'RMD {remote_path}')
        self.ftp.rmd(remote_path)

    def retrive_file(self, local_path, remote_path):
        """Download remote_path to local_path"""
        remote_path = add_slash_if_need(remote_path)
        print(f"Receiving {local_path}")
        with open(local_path, "wb+") as file:
            self.ftp.retrbinary(f"RETR {remote_path}", file.write)
            print(f"RETR {remote_path} --> {local_path}")

    def retrive_directory(self, local_path, remote_path):
        "Recursively download directory"
        remote_path = add_slash_if_need(remote_path)
        makedirs(local_path, exist_ok=True)
        directories, files = self.listcontent(remote_path)
        for directory in directories:
            self.retrive_directory(join(local_path, directory), join(remote_path, directory))
        for file in files:
            self.retrive_file(join(local_path, file), join(remote_path, file))

    def cwd(self, path):
        "Change Working Directory"
        path = add_slash_if_need(path)
        try:
            self.ftp.cwd(path)
        except all_errors:
            return False
        return True

    def rename(self, old_path, new_path):
        print(f"RNME {old_path} --> {new_path}")
        old_path = add_slash_if_need(old_path)
        new_path = add_slash_if_need(new_path)
        self.ftp.rename(old_path, new_path)

def add_slash_if_need(path):
    """ a/b/c -> /a/b/c"""
    return path if path.startswith("/") else "/"+path

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print(f"Usage: {sys.argv[0]} ip port commands ...")
        sys.exit(-1)
    run(sys.argv[1], sys.argv[2], sys.argv[3:])
