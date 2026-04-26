# Zero Trust DNS Configuration
## GoDaddy DNS Records for collectivekitty.com

### Current Configuration (Verified 2026-04-26)

| Record Type | Name | Value | TTL |
|------------|------|-------|------|
| A | @ | 185.199.108.153 | 600 |
| A | @ | 185.199.109.153 | 600 |
| A | @ | 185.199.110.153 | 600 |
| A | @ | 185.199.111.153 | 600 |
| CNAME | www | SNAPKITTYWEST.github.io | 600 |

### Zero Trust Email Security (SPF/DKIM/DMARC)

#### SPF (Sender Policy Framework)
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.google.com ~all
TTL: 3600
```

#### DKIM (DomainKeys Identified Mail)
```
Type: TXT
Name: google._domainkey
Value: v=DKIM1; k=rsa; p=<PUBLIC_KEY>
TTL: 3600
```
*Generate key via Google Admin Console > Security > DKIM*

#### DMARC (Domain-based Message Authentication)
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@collectivekitty.com
TTL: 3600
```

### DNSSEC Configuration
```
Type: DS
Key Tag: <KEY_TAG>
Algorithm: 13
Digest Type: 2
Digest: <DIGEST_HASH>
```
*Configure via GoDaddy > Domain > DNSSEC*

### Recommended Additional Records

#### Mailservers
```
MX: @ -> aspmx.l.google.com (priority 1)
MX: @ -> alt1.aspmx.l.google.com (priority 5)
```

#### Verification
```
TXT: @ -> google-site-verification=<CODE>
```

## Action Items
- [ ] Enable DNSSEC in GoDaddy
- [ ] Configure SPF record
- [ ] Set up DKIM in Google Workspace
- [ ] Configure DMARC policy