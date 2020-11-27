using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using PeopleBotTrust.Models;
using PeopleBotTrust.Services;

namespace PeopleBotTrust.Controllers
{
    public class MembersController : Controller
    {
        // declare
        public MemberService MemberService { get; set; }

        // initialize
        public MembersController()
        {
            MemberService = new MemberService();
        }

        public ActionResult Index()
        {
            //var memberService = new MemberService();
            var model = MemberService.GetList();           

            return View(model);
        }

        // GET: Members/Details
        public ActionResult Details(int id)

        {
            //var memberService = new MemberService();
            var detail = MemberService.GetDetail(id);
            return View(detail);
        }


        public ActionResult Edit(int id)
        {
            //var memberService = new MemberService();
            var detail = MemberService.GetDetail(id);
            if (detail == null)
            {
                throw new Exception("Invalid Page");
            }
            return View(detail);
        }


        [HttpPost]
        public ActionResult Edit(MemberModel member)
        {
            //var memberService = new MemberService();
            var detail = MemberService.GetDetail(member.Id);
            if (detail == null)
            {
                throw new Exception("Invalid Page");
            }
            else {
                MemberService.Update(member);
            }            
            return RedirectToAction("Index","members");
        }

        // GET: New Member/Create
        public ActionResult Create()
        {
            return View();
        }

        [HttpPost]
        public ActionResult Create(MemberModel memberModel)
        {
            //var id = memberService.Create(memberModel);

            var id = MemberService.Create(memberModel.FirstName, memberModel.LastName, memberModel.Address);

            
            return RedirectToAction("index");
        }

        //Delete Member
        public ActionResult Delete(int id)
        {
            var detail = MemberService.GetDetail(id);
            return View(detail);
        }

        [HttpPost]
        public ActionResult Delete(int id, FormCollection fc)
        {

            MemberService.Delete(id);
            
            return RedirectToAction("Index", "Members");
        }

    }
}