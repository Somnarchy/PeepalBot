using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;

namespace Peepalbot.Services
{
    public static class FileService
    {
        // save file

        public static string SaveFile(HttpPostedFileBase httpfile, string folderPath)
        {
            if(httpfile.ContentLength > 0)
            {
                string _FileName = Path.GetFileName(httpfile.FileName);
                string _path = Path.Combine(folderPath, _FileName);
                httpfile.SaveAs(_path);

                return _FileName;
            }
            return null;
        }


        // delete file 
        public static void DeleteFile(string fullPath)
        {
            if (System.IO.File.Exists(fullPath))
            {
                System.IO.File.Delete(fullPath);
            }
        }

        // get FullPath
        public static string GetFullPath(string folderpath, string fileName)
        {
            return Path.Combine(folderpath , fileName);
        }
    }
}