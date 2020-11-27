using PeopleBotTrust.Models;
using PeopleBotTrust.Repository;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace PeopleBotTrust.Services
{
    public class MemberService
    {
        private MemberRepository MemberRepository { get; set; }
        //private List<MemberModel> MemberList{ get; set; }        

        public MemberService()
        {
            MemberRepository = new MemberRepository();
            //MemberList = new List<MemberModel>();
            //var memberSuresh = new MemberModel()
            //{
            //    Id = 1,
            //    FirstName = "Suresh",
            //    LastName = "Maharjan",
            //    Address = "NY",     
            //    MyPhone ="213-23-123213",
            //};
            
            //var memberSujata = new MemberModel()
            //{

            //    Id = 2,
            //    FirstName = "Sujata",
            //    LastName = "Maharjan",
            //    Address = "NY"
            //};

            //MemberList.Add(memberSuresh);
            //MemberList.Add(memberSujata);

            //MemberList.Add(new MemberModel()
            //{
            //    Id = 3,
            //    FirstName = "Subin",
            //    LastName = "Maharjan",
            //    Address = "PA"
            //});
        }

        public List<MemberModel> GetList()
        {
           return MemberRepository.GetList();
        }

        public MemberModel GetDetail(int memberIds)
        {
            return MemberRepository.GetDetail(memberIds);
        }

        public int Create(MemberModel model)
        {
            return MemberRepository.Save(model);
        }

        public int Create(string FirstName, string Lastname, string address)
        {
           return MemberRepository.Save(FirstName, Lastname, address);
        }

        public void Update(MemberModel model)
        {
            MemberRepository.Update(model);

        }
        public void Delete(int id)
        {
            MemberRepository.Delete(id);
        }


    }
}