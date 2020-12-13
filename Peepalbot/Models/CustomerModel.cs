using EFPeepalbot;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Peepalbot.Models
{
    public class CustomerModel
    {
        public Customer CustomerDetails { get; set; }
        public Account AccountDetails { get; set; }

        public List<SelectListItem> AccountTypeSelectList { get; set; }
        public List<SelectListItem> CustomerSelectList { get; set; }
        public List<Customer> CustomerList { get; set; }


    }
}