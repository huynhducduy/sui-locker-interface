# SUI Locker Interface

SuiLocker: Decentralized, permissionless, SUI-native, fully on-chain vault.

This is the interface for to interact with the SuiLocker.

The core interface functionality are manages the vaults `Vault` and the entries `Entry` within them.

Each user can have multiple vaults, and each vault can have multiple entries.

The `Vault` contains:

- A `name` (required, the name of the vault)
- A `description` (optional, a short description of the vault)
- A `image_url` (optional, a URL to the image or preview image of the vault)
- A `thumbnail_url` (optional, a URL to the thumbnail of the vault)
- A `created_at` (required, the timestamp of the vault creation)
- An `entry_count` (the number of entries in the vault)

**Entry**
The entry contains:

- A `vault_id` (required, the ID of the parent vault)
- A `name` (required, the encrypted name of the entry)
- A `hash` (required, the checksum of the content)
- A `content` (required, the encrypted content)
- A `type` (optional, the MIME type of the content, follows IANA Media Types standard)
- A `description` (optional, a short description of the entry)
- A `tags` (optional, a list of tags for the entry)
- A `notes` (optional, notes for the entry)
- A `image_url` (optional, a URL to the image or preview image of the entry)
- A `thumbnail_url` (optional, a URL to the thumbnail of the entry)
- A `link` (optional, a link related to the entry)
- A `created_at` (required, the timestamp of the entry creation)
- A `updated_at` (required, the timestamp of the entry last update)

The interface must enable user to CRUD the vaults and entries. Plus sort, filter, and search the entries.

The API is not available yet, please mock the data for now.

## Setup

```sh
pnpm install
```

## Development

Create a `.env.development(.local?)` based on `.env.example`

```sh
pnpm dev
```

### Devtools

Come with [react-dev-inspector](https://github.com/zthxxx/react-dev-inspector)

To open, use keyboard shortcuts:

- On macOS: `Ctrl + Shift + Command + C`
- On Windows / Linux: `Ctrl + Shift + Alt + C`

## Staging (Test)

Create a `.env.staging(.local?)` based on `.env.example`

```sh
pnpm build --mode staging
```

## Production

Create a `.env.production(.local?)` based on `.env.example`

```sh
pnpm build
```
