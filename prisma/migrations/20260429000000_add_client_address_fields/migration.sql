-- Adiciona campos de identificação fiscal extra (IE) e endereço completo
-- ao cliente, alinhando o schema com os formulários de cadastro/edição.

ALTER TABLE `client`
    ADD COLUMN `ie`           VARCHAR(191) NULL,
    ADD COLUMN `zip`          VARCHAR(191) NULL,
    ADD COLUMN `street`       VARCHAR(191) NULL,
    ADD COLUMN `number`       VARCHAR(191) NULL,
    ADD COLUMN `neighborhood` VARCHAR(191) NULL,
    ADD COLUMN `city`         VARCHAR(191) NULL,
    ADD COLUMN `state`        VARCHAR(191) NULL,
    ADD COLUMN `notes`        VARCHAR(191) NULL;
