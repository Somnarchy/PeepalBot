using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace PeopleBotTrust.Models
{
    public class MemberModel
    {
        public int Id{ get; set; }
        public string FirstName{ get; set; }
        public string LastName { get; set; }
        public string Address { get; set; }
        public string MyPhone { get; set; }
        public string Email { get; set; }
        public string Info { get; set; }
        public DateTime? DOB { get; set; }

        public string FullName
        {
            get
            {
                return FirstName + " " + LastName;
            }

        }


    }
    
}