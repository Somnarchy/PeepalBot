using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Web;
using System.Web.Mvc;
using System.Web.WebPages;

namespace PeopleBotTrust.Helpers
{
    public static partial class HtmlHelperExtensions
    {
       
        /// <summary>
        /// 
        /// </summary>
        /// <param name="html"></param>
        /// <param name="labelText"></param>
        /// <param name="link"></param>
        /// <param name="htmlAttributes"></param>
        /// <returns></returns>
        public static MvcHtmlString ActionLinkHtml(this HtmlHelper html, Func<object, HelperResult> labelText, string link, object htmlAttributes = null)
        {
            //string atag =$"<a >{labelText}</a>";
            string atag = "<a href='"+ link + "' >" + labelText(null).ToHtmlString().ToString() + "</a>";

            return MvcHtmlString.Create(atag);

        }

    }
}