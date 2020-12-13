using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Peepalbot.Helpers
{
    public class ResponseMessage
    {
        public bool Status { get; set; }
        public MessageType MessageType { get; }
        public string Message { get; set; }
        public string Title { get; set; }
        public object Data { get; set; }

        public ResponseMessage(MessageType messageType)
        {
            MessageType = messageType;
        }
    }

    public enum MessageType
    { 
        Success = 0,
        Warning =1,
        Failure = 2,
        Info = 3,
        InProgress = 4
            
    }
}