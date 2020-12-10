CREATE TABLE [dbo].[Account] (
    [Id]            INT          IDENTITY (1, 1) NOT NULL,
    [Name]          VARCHAR (50) NOT NULL,
    [CustomerId]    INT          NOT NULL,
    [AccountTypeId] SMALLINT     NOT NULL,
    [CreatedDate]   DATETIME     NOT NULL,
    [CreatedBy]     INT          NOT NULL,
    [ModifiedDate]  DATETIME     NULL,
    [ModifiedBy]    INT          NULL,
    [Status]        BIT          NULL,
    PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_AccountCustomerId] FOREIGN KEY ([CustomerId]) REFERENCES [dbo].[Customer] ([Id]),
    CONSTRAINT [FK_AccountAccountTypeId] FOREIGN KEY ([AccountTypeId]) REFERENCES [dbo].[AccountType] ([Id])
);

