using EFPeepalbot;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Peepalbot.Models
{
    public class CustomerDocumentModel
    {
        public CustomerDocument CustomerDocument { get; set; }
        public List<CustomerDocument> CustomerDocumentList { get; set; }
        public List<SelectListItem> DocumentTypeSelectList { get; set; }
        public List<SelectListItem> CustomerSelectList { get; set; }

    }
}