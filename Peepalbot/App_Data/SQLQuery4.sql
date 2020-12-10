CREATE TABLE [dbo].[Customer] (
    [Id]           INT            IDENTITY (1, 1) NOT NULL,
    [FirstName]    NVARCHAR (50)  NOT NULL,
    [MiddleName]   NVARCHAR (50)  NULL,
    [LastName]     NVARCHAR (50)  NULL,
    [Description]  NVARCHAR (MAX) NULL,
    [Address1]     NVARCHAR (50)  NULL,
    [Address2]     NVARCHAR (50)  NULL,
    [City]         NVARCHAR (50)  NULL,
    [ZipCode]      NVARCHAR (50)  NULL,
    [Phone]        NVARCHAR (50)  NULL,
    [CreatedBy]    NVARCHAR (50)  NULL,
    [CreatedDate]  DATETIME       NULL,
    [ModifiedBy]   NVARCHAR (50)  NULL,
    [ModifiedDate] DATETIME       NULL,
    [Status]       BIT            NULL,
    PRIMARY KEY CLUSTERED ([Id] ASC)
);
