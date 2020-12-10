CREATE TABLE [dbo].[Department] (
    [Id]          SMALLINT       IDENTITY (1, 1) NOT NULL,
    [Name]        NVARCHAR (MAX) NOT NULL,
    [Description] NVARCHAR (50)  NULL,
    PRIMARY KEY CLUSTERED ([Id] ASC)
);

