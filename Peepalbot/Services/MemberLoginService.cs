using Peepalbot.Models;
using System;
using System.Collections.Generic;

namespace Peepalbot.Services
{
    public class MemberLoginService
    {
        public List<MemberLoginInfoModel> MemberLoginList { get; set; }
        public MemberLoginService()
        {
            MemberLoginList = new List<MemberLoginInfoModel> {
            new MemberLoginInfoModel {UserName="suresh",Password="Somnarchy"},
            new MemberLoginInfoModel {UserName="subin",Password="bhotebahal"},
            };
        }
    }
}