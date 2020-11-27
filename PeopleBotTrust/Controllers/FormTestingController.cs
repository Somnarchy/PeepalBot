using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using PeopleBotTrust.Models;

namespace PeopleBotTrust.Controllers
{
    public class FormTestingController : Controller
    {
        // GET: FormTesting

        public ActionResult Index()
        {
            var Sureshmodel = new FormTestingModel()
            {   Id = 1,
                FirstName = "Suresh",
                Information = "This is the profile of Suresh Maharjan",
                Gender = "Male",
                Image = "PhotoOfSuresh",
                Username = "Somnarchy",
                Password = "Password",
                IsMarried = true,
            };
            var Sujatamodel = new FormTestingModel()
            {   Id=2,
                FirstName = "Sujata",
                Information = "This is the profile of Suresh Maharjan",
                Gender = "Male",
                Image = "PhotoOfSuresh",
                Username = "Somnarchy",
                Password = "Password",
                IsMarried = true,
            };

            var list = new List<FormTestingModel>();
            list.Add(Sureshmodel);
            list.Add(Sujatamodel);
            return View(list); 
        }

        // GET: FormTesting/Details/5
        public ActionResult Details(int id)

        { 

            return View();
        }

        // GET: FormTesting/Create
        public ActionResult Create()
        {
            var model = new FormTestingModel();
            return View(model);
        }

        // POST: FormTesting/Create
        [HttpPost]
        public ActionResult Create(FormCollection collection)
        {
            try
            {
                // TODO: Add insert logic here
                var model = new FormTestingModel()
                {
                    FirstName = collection["firstname"],
                };
                return RedirectToAction("Index");
            }
            catch
            {
                return View();
            }
        }

        // GET: FormTesting/Edit/5
        public ActionResult Edit(int id)
        {
            var model = new FormTestingModel()
            {
                FirstName = "Sujata",
                DOB = DateTime.Now,
                Gender= "Female",
                IsMarried=true,
                FavoriteCousine="japanese cousine"
            };
            return View(model);
        }

        // POST: FormTesting/Edit/5
        [HttpPost]
        public ActionResult Edit(int id, FormTestingModel  formTestingModel, FormCollection collection)
        {
            try
            {
                

                return RedirectToAction("Index");
            }
            catch
            {
                return View();
            }
        }

        // GET: FormTesting/Delete/5
        public ActionResult Delete(int id)
        {
            return View();
        }

        // POST: FormTesting/Delete/5
        [HttpPost]
        public ActionResult Delete(int id, FormCollection collection)
        {
            try
            {
                // TODO: Add delete logic here

                return RedirectToAction("Index");
            }
            catch
            {
                return View();
            }
        }


        public JsonResult AjaxTest(string kv)
        {
            var result = new  { name="Suresh", lname="Maharjan"  };
            return Json(result, JsonRequestBehavior.AllowGet);
        }
    }
}
