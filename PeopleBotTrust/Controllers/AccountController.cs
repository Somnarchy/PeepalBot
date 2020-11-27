using EFPeopleBotTrust;
using PeopleBotTrust.Helpers;
using PeopleBotTrust.Models;
using PeopleBotTrust.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Web;
using System.Web.Mvc;

namespace PeopleBotTrust.Controllers
{
    public class AccountController : Controller
    {
        readonly AccountService accountService;
        public AccountController()
        {
            accountService = new AccountService();
        }

        // GET: Account
        public ActionResult Index()
        {
            var model = new AccountViewModel();
            model.AccountList = accountService.GetList();
            return View(model);
        }

        // GET: Account/Details/5
        public ActionResult Details(int id)

        {
            var account = accountService.GetDetails(id);

            if (Request.IsAjaxRequest())
            {
                //return PartialView("_details",model);
                ResponseMessage responseMessage = new ResponseMessage(MessageType.Info)
                {
                    Status = true,
                    Message = "",
                    Data = account,
                    Title = "Fetch Detail",
                };
                return Json(responseMessage, JsonRequestBehavior.AllowGet);
            }
            return View(account);
        }

        // GET: Account/Create
        public ActionResult Create()
        {

            #region Account Type
            var accountTypeService = new AccountTypeService();
            
            #endregion

            #region Customer List
            var customerService = new CustomerService();
       
            #endregion

            var model = new AccountViewModel()
            {
                AccountTypeList = accountTypeService.GetSelectList(),
                CustomerList = customerService.GetSelectList(),
            };

            return View(model);
        }

        // POST: Account/Create
        [HttpPost]
        // public ActionResult Create(FormCollection collection)
        public ActionResult Create(AccountViewModel model, FormCollection collection)
        {
            try
            {                
                accountService.Create(model.Account);

                return RedirectToAction("Index");
            }
            catch(Exception e)
            {
                return View();
            }
        }

        // GET: Account/Edit/5
        public ActionResult Edit(int id)
        {
            #region Account Type
            var accountTypeService = new AccountTypeService();
            #endregion

            #region Customer List
            var customerService = new CustomerService();

            #endregion

            var model = new AccountViewModel()
            {
                Account = accountService.GetDetails(id),
                AccountTypeList = accountTypeService.GetSelectList(),
                CustomerList = customerService.GetSelectList(),
            };

            return View(model);
        }

        // POST: Account/Edit/5
        [HttpPost]
        public ActionResult Edit(AccountViewModel model, FormCollection collection)
        {
            try
            {
                var oldAccount = accountService.GetDetails(model.Account.Id);

                //oldAccount.CustomerId = model.Account.CustomerId;
                oldAccount.Name = model.Account.Name;
                oldAccount.AccountTypeId = model.Account.AccountTypeId;
                //oldAccount.ModifiedBy = model.Account.ModifiedBy;

                accountService.Update(oldAccount);
                return RedirectToAction("Index");
            }
            catch(Exception e)
            {
                return View(model);
            }
        }

        // POST: Account/Delete/5

        [HttpPost]
        public JsonResult Delete(int id, FormCollection collection)
        {
            ResponseMessage responseMessage = null;
            try
            {
                accountService.Delete(id);
                responseMessage = new ResponseMessage(MessageType.Success)
                {
                    Status = true,
                    Message = "Record successfully deleted.",
                    Title = "Delete record.",
                };
            }
            catch (Exception e)
            {
                responseMessage = new ResponseMessage(MessageType.Failure)
                {
                    Status = false,
                    Message = e.Message,
                    Title = "Error Deleting record."

                };
            }
            return Json(responseMessage);
        }
    }
}
