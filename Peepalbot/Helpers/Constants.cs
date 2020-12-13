using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Peepalbot.Helpers
{
    public static class Constants
    {

        public const string CustomerBaseFolder = "~/content/UploadFiles/CustomerDocuments/"; // custoemrdocument/ Id/

        public const string GalleryFolder = "galleryXY";

        public const string ForumFolder = "forum";

        public static string GetCustomerBaseFolder()
        {
            return HttpContext.Current.Server.MapPath(CustomerBaseFolder);
        }

        public static string GetCustomerGalleryFolder(int id)
        {
            return HttpContext.Current.Server.MapPath(CustomerBaseFolder + id + "/" + GalleryFolder);
        }

        /// <summary>
        /// this method is used to get customer document folder name 
        /// base on customer id
        /// </summary>
        /// <param name="id"> customer id</param>
        /// <param name="createifNotExist"></param>
        /// <returns></returns>
        public static string GetCustomerDocumentFolder(int id, bool createifNotExist = false)
        {
            var folderName = GetCustomerBaseFolder() + id.ToString();
            if(!System.IO.File.Exists(folderName) && createifNotExist == true)
            {
                Directory.CreateDirectory(folderName);
            }
            return folderName;
        }
    }
}