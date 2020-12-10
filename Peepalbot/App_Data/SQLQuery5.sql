CREATE TABLE [dbo].[CustomerDocument] (
    [Id]              INT      IDENTITY (1, 1) NOT NULL,
    [CustomerId]      INT      NOT NULL,
    [DocumentTypeId]  SMALLINT NOT NULL,
    [DocumentContent] TEXT     NOT NULL,
    PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_CustomerDocumentDocType] FOREIGN KEY ([DocumentTypeId]) REFERENCES [dbo].[DocumentType] ([Id]),
    CONSTRAINT [FK_CustomerDocumentCustomerId] FOREIGN KEY ([CustomerId]) REFERENCES [dbo].[Customer] ([Id])
);

