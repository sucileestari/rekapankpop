<template>
  <main v-if="!session.user" class="login-screen">
    <section class="login-panel">
      <div class="login-brand">
        <div class="brand-mark">RT</div>
        <div>
          <p class="eyebrow">Rekap Transaksi</p>
          <h1>Rekap Transaksi</h1>
          <p class="login-copy">Login sebagai admin untuk mengelola data, atau pilih Guest untuk mengirim bukti pembayaran.</p>
        </div>
      </div>

      <form class="login-form" @submit.prevent="login">
        <label>
          Username
          <input v-model="loginForm.username" autocomplete="username" placeholder="Masukkan username" />
        </label>
        <label>
          Password
          <input v-model="loginForm.password" autocomplete="current-password" type="password" placeholder="Password" />
        </label>
        <button class="primary-action" type="submit" :disabled="loading">{{ loading ? 'Memproses...' : 'Login' }}</button>
        <button class="guest-login-button" type="button" :disabled="loading" @click="loginAsGuest">Guest</button>
        <p v-if="error" class="error">{{ error }}</p>
      </form>
    </section>
  </main>

  <main v-else class="app-shell" :class="{ 'sidebar-hidden': isSidebarHidden }">
    <aside class="sidebar">
      <div class="sidebar-top">
        <div class="brand-row">
          <div class="brand-mark">RT</div>
          <div>
            <p class="brand-kicker">Rekap</p>
            <h2>Transaksi</h2>
          </div>
          <button class="sidebar-toggle" type="button" :aria-label="isSidebarHidden ? 'Tampilkan side menu' : 'Sembunyikan side menu'" @click="toggleSidebar">
            <svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
        </div>

        <div class="user-card">
          <div class="avatar">{{ userInitials }}</div>
          <div>
            <strong>{{ session.user.name }}</strong>
            <span>{{ roleLabel }}</span>
          </div>
        </div>

        <nav class="side-nav" aria-label="Menu utama">
          <button v-if="canWrite" :class="{ active: activeMenu === 'members' }" :title="isSidebarHidden ? 'Anggota' : ''" @click="goToMembers">
            <span class="nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M16 11a4 4 0 1 0-3.5-5.9M12 15H6.8A3.8 3.8 0 0 0 3 18.8V20h11M17 14v6M20 17h-6"/></svg>
            </span>
            <span>
              Anggota
              <small>{{ members.length }} data</small>
            </span>
          </button>
          <button :class="{ active: activeMenu === 'recap' }" :title="isSidebarHidden ? 'Rekap' : ''" @click="goToRecap">
            <span class="nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M4 19V5M4 19h16M8 15v-4M12 15V8M16 15v-6M7 5h10M17 5l-2 2M17 5l-2-2"/></svg>
            </span>
            <span>
              Rekap
              <small>Category</small>
            </span>
          </button>
          <button v-if="isSuperAdmin" :class="{ active: activeMenu === 'database' }" :title="isSidebarHidden ? 'Database' : ''" @click="goToDatabase">
            <span class="nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M4 7c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3Zm0 0v5c0 1.7 3.6 3 8 3s8-1.3 8-3V7M4 12v5c0 1.7 3.6 3 8 3s8-1.3 8-3v-5"/></svg>
            </span>
            <span>
              Database
              <small>Bersihkan data</small>
            </span>
          </button>
          <button v-if="isSuperAdmin" :class="{ active: activeMenu === 'users' }" :title="isSidebarHidden ? 'Users' : ''" @click="goToUsers">
            <span class="nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-7 8a7 7 0 0 1 14 0M18 8l2 2 3-4"/></svg>
            </span>
            <span>
              Users
              <small>Role & akses</small>
            </span>
          </button>
          <button v-if="isSuperAdmin" :class="{ active: activeMenu === 'roles' }" :title="isSidebarHidden ? 'Roles' : ''" @click="goToRoles">
            <span class="nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M12 3 5 6v5c0 4.4 3 8.4 7 10 4-1.6 7-5.6 7-10V6l-7-3Zm-3 9 2 2 4-5"/></svg>
            </span>
            <span>
              Roles
              <small>Permission</small>
            </span>
          </button>
        </nav>
      </div>

      <button class="logout-button" type="button" :title="isSidebarHidden ? 'Logout' : ''" aria-label="Logout" @click="logout">
        <span class="nav-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M10 6H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4M14 8l4 4-4 4M18 12H9"/></svg>
        </span>
        <span>Logout</span>
      </button>
    </aside>

    <button v-if="isSidebarHidden" class="sidebar-restore" type="button" aria-label="Tampilkan side menu" @click="toggleSidebar">
      <svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
      <span>Menu</span>
    </button>

    <button v-if="isSidebarHidden" class="sidebar-floating-logout" type="button" aria-label="Logout" @click="logout">
      <svg viewBox="0 0 24 24"><path d="M10 6H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4M14 8l4 4-4 4M18 12H9"/></svg>
      <span>Logout</span>
    </button>

    <section class="content">
      <header class="page-header">
        <div>
          <p class="eyebrow">{{ pageMeta.eyebrow }}</p>
          <h1>{{ pageMeta.title }}</h1>
          <p class="page-subtitle">{{ pageMeta.subtitle }}</p>
        </div>
        <div class="header-actions">
          <div class="header-action-group">
            <button v-if="selectedCountry" class="secondary action-button" type="button" @click="goBackToCategories">
              <span aria-hidden="true">←</span>
              Kembali
            </button>
            <button v-if="canWrite && activeMenu === 'members'" class="primary-action action-button" @click="openMemberModal">
              <span aria-hidden="true">+</span>
              Add Anggota
            </button>
            <button v-if="canWrite && activeMenu === 'recap' && !selectedCountry" class="primary-action action-button" @click="openCategoryModal()">
              <span aria-hidden="true">+</span>
              Add Category
            </button>
            <button v-if="canWrite && selectedCountry" class="secondary action-button" @click="openBatchModal">
              <span aria-hidden="true">+</span>
              Add Batch
            </button>
            <button v-if="canWrite && selectedCountry" class="primary-action action-button" @click="openRecapModal()">
              <span aria-hidden="true">+</span>
              Add Rekapan
            </button>
          </div>
          <span v-if="!canWrite" class="readonly-badge">Akses Upload Bukti</span>
        </div>
      </header>

      <div class="page-body">
        <section v-if="activeMenu === 'members'" class="panel">
          <div class="toolbar">
            <div class="search-field">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 21-4.5-4.5M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z"/></svg>
              <input v-model="memberSearch" placeholder="Cari nama atau nomor WA" @input="loadMembers" />
            </div>
            <div v-if="canWrite" class="toolbar-actions">
              <button class="secondary compact" type="button" @click="downloadMemberTemplate">Template</button>
              <button class="secondary compact" type="button" :disabled="importingMembers" @click="openMemberImport">
                {{ importingMembers ? 'Importing...' : 'Import' }}
              </button>
              <button class="secondary compact" type="button" :disabled="!members.length" @click="exportMembers">Export</button>
              <input ref="memberImportInput" class="sr-only-file" type="file" accept=".csv,text/csv" @change="importMembersCsv" />
            </div>
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Nomor WA</th>
                  <th>Tanggal Dibuat</th>
                  <th>Last Update</th>
                  <th v-if="canWrite">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="member in members" :key="member.id">
                  <td>{{ member.name }}</td>
                  <td>{{ member.whatsapp_number }}</td>
                  <td>{{ formatDate(member.created_at) }}</td>
                  <td>{{ formatDate(member.updated_at) }}</td>
                  <td v-if="canWrite">
                    <div class="row-actions">
                      <button class="secondary compact" type="button" @click="openMemberModal(member)">Edit</button>
                      <button class="danger compact" type="button" @click="deleteMember(member)">Delete</button>
                    </div>
                  </td>
                </tr>
                <tr v-if="!members.length">
                  <td :colspan="canWrite ? 5 : 4" class="empty">Belum ada anggota.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section v-else-if="activeMenu === 'database'" class="panel danger-zone">
        <h2>Bersihkan Database</h2>
        <div class="danger-announcement">
          <strong>Perhatian sebelum membersihkan database</strong>
          <span>Aksi ini dapat menghapus semua data anggota, batch, dan rekapan transaksi. Pastikan data sudah benar-benar tidak dibutuhkan atau sudah dibackup.</span>
        </div>
        <p>Membersihkan data anggota, batch, dan rekapan transaksi. Akun login dan category rekap tetap disimpan.</p>
        <label>
          Ketik BERSIHKAN
          <input v-model="cleanConfirm" placeholder="BERSIHKAN" />
        </label>
        <button class="danger" type="button" :disabled="cleanConfirm !== 'BERSIHKAN'" @click="cleanDatabase">Bersihkan Database</button>
        <p v-if="modalError" class="error">{{ modalError }}</p>
        </section>

        <section v-else-if="activeMenu === 'users'" class="users-page">
          <div class="user-summary-grid">
            <article class="user-stat-card">
              <span>Total User</span>
              <strong>{{ users.length }}</strong>
            </article>
            <article class="user-stat-card">
              <span>Super Admin</span>
              <strong>{{ userRoleCounts.super_admin }}</strong>
            </article>
            <article class="user-stat-card">
              <span>Admin</span>
              <strong>{{ userRoleCounts.admin }}</strong>
            </article>
            <article class="user-stat-card">
              <span>Guest</span>
              <strong>{{ userRoleCounts.guest }}</strong>
            </article>
          </div>

          <section class="panel users-panel">
            <div class="users-panel-header">
              <div>
                <h2>Daftar User</h2>
                <p>Atur akses login dan permission role tiap user.</p>
              </div>
              <button class="primary-action" type="button" @click="openUserModal()">Add User</button>
            </div>

            <div class="table-wrap">
              <table class="users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Tanggal Dibuat</th>
                    <th>Last Update</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="user in users" :key="user.id">
                    <td>
                      <div class="user-name-cell">
                        <span class="user-avatar-sm">{{ getInitials(user.name) }}</span>
                        <div>
                          <strong>{{ user.name }}</strong>
                          <small v-if="user.id === session.user.id">Sedang login</small>
                        </div>
                      </div>
                    </td>
                    <td><span class="username-pill">{{ user.username }}</span></td>
                    <td><span class="role-badge" :class="`role-${user.role}`">{{ formatRole(user.role) }}</span></td>
                    <td>{{ formatDate(user.created_at) }}</td>
                    <td>{{ formatDate(user.updated_at) }}</td>
                    <td>
                      <div class="row-actions">
                        <button class="secondary compact" type="button" @click="openUserModal(user)">Edit</button>
                        <button class="danger compact" type="button" :disabled="user.id === session.user.id" @click="deleteUser(user)">Hapus</button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="!users.length">
                    <td colspan="6" class="empty">Belum ada user.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </section>

        <section v-else-if="activeMenu === 'roles'" class="roles-page">
          <section class="panel roles-panel">
            <div class="users-panel-header">
              <div>
                <h2>Roles Permission</h2>
                <p>Ringkasan akses tiap role yang berlaku di aplikasi.</p>
              </div>
              <div class="row-actions">
                <span class="role-badge role-super_admin">Super Admin full access</span>
                <button class="primary-action compact" type="button" @click="openRoleModal()">Add Permission</button>
              </div>
            </div>

            <div class="table-wrap">
              <table class="roles-table">
                <thead>
                  <tr>
                    <th>Permission</th>
                    <th>Guest</th>
                    <th>Admin</th>
                    <th>Super Admin</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="permission in rolePermissions" :key="permission.key">
                    <td>
                      <strong>{{ permission.label }}</strong>
                      <small class="table-subtext">{{ permission.description }}</small>
                    </td>
                    <td><span class="permission-pill" :class="{ enabled: permission.guest }">{{ permission.guest ? 'Aktif' : 'Tidak' }}</span></td>
                    <td><span class="permission-pill" :class="{ enabled: permission.admin }">{{ permission.admin ? 'Aktif' : 'Tidak' }}</span></td>
                    <td><span class="permission-pill enabled">Aktif</span></td>
                    <td><button class="secondary compact" type="button" @click="openRoleModal(permission)">Edit</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </section>

        <section v-else-if="!selectedCountry" class="category-grid">
        <article v-for="category in recapCategories" :key="category.slug" class="category-card" @click="openCountry(category.slug)">
          <img v-if="category.image_path" class="category-image" :src="getAssetUrl(category.image_path)" :alt="category.name" />
          <div class="category-content">
            <span class="category-name">{{ category.name }}</span>
            <strong class="category-total">
              <span class="category-number">{{ countryTotals[category.slug]?.count || 0 }}</span>
              <span class="category-label">Rekapan</span>
            </strong>
            <small>{{ formatCurrency(countryTotals[category.slug]?.amount || 0) }}</small>
            <div v-if="canWrite && category.id" class="category-actions">
              <button class="secondary compact" type="button" @click.stop="openCategoryModal(category)">Edit</button>
              <button class="danger compact" type="button" @click.stop="deleteCategory(category)">Hapus</button>
            </div>
          </div>
        </article>
        </section>

        <section v-else class="recap-detail">
        <div class="batch-strip">
          <button class="batch-chip" :class="{ active: selectedBatchId === '' }" type="button" @click="selectedBatchId = ''">
            <strong>Semua Batch</strong>
            <span>{{ currentTransactions.length }} rekapan</span>
          </button>
          <button v-for="batch in currentBatches" :key="batch.id" class="batch-chip" :class="{ active: selectedBatchId === batch.id }" type="button" @click="selectedBatchId = batch.id">
            <div class="batch-content">
              <strong>{{ batch.name }}</strong>
              <span>{{ formatDateOnly(batch.start_date) }} - {{ formatDateOnly(batch.end_date) }}</span>
            </div>
          </button>
          <div v-if="!currentBatches.length" class="batch-chip muted">
            <strong>Belum ada batch</strong>
            <span>Tambahkan batch untuk kategori ini.</span>
          </div>
        </div>

        <section class="panel">
          <div class="toolbar">
            <div class="search-field">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 21-4.5-4.5M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z"/></svg>
              <input v-model="recapSearch" placeholder="Cari nama anggota atau nomor WA" />
            </div>
            <div v-if="canWrite" class="toolbar-actions">
              <button class="secondary compact" type="button" @click="downloadRecapTemplate">Template</button>
              <button class="secondary compact" type="button" :disabled="importingRecaps" @click="openRecapImport">
                {{ importingRecaps ? 'Importing...' : 'Import' }}
              </button>
              <button class="secondary compact" type="button" :disabled="!filteredTransactions.length" @click="exportRecaps">Export</button>
              <input ref="recapImportInput" class="sr-only-file" type="file" accept=".csv,text/csv" @change="importRecapsCsv" />
            </div>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>Anggota</th>
                  <th>Nama Barang</th>
                  <th>QTY</th>
                  <th>Harga</th>
                  <th>Jatuh Tempo</th>
                  <th>Last Payment Down Payment</th>
                  <th>Last Payment Pelunasan</th>
                  <th>Last Update</th>
                  <th v-if="canWrite">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="transaction in filteredTransactions" :key="transaction.id">
                  <td>{{ transaction.recap_batches?.name || '-' }}</td>
                  <td>
                    <strong>{{ transaction.members?.name || '-' }}</strong>
                    <small class="table-subtext">{{ transaction.members?.whatsapp_number }}</small>
                  </td>
                  <td>{{ transaction.product_name }}</td>
                  <td>{{ transaction.quantity }}</td>
                  <td>{{ formatCurrency(getTransactionTotal(transaction)) }}</td>
                  <td>{{ transaction.due_days }} hari</td>
                  <td>
                    <div class="payment-cell">
                      <template v-if="isDirectSettlement(transaction)">
                        <span class="payment-action settlement paid static">Pelunasan</span>
                        <small>Lunas tanpa DP. Upload bukti pelunasan.</small>
                      </template>
                      <template v-else-if="isDpApproved(transaction)">
                        <span class="payment-action dp approved static">Down Payment</span>
                        <small>{{ formatDateOnly(transaction.dp_date) }} · {{ formatCurrency(transaction.dp_amount) }}</small>
                      </template>
                      <template v-else>
                        <button
                          class="payment-action dp"
                          type="button"
                          :disabled="!canSubmitPaymentProof || isDpPending(transaction)"
                          @click="openPaymentModal(transaction, 'dp')"
                        >
                          Down Payment
                        </button>
                        <small v-if="transaction.dp_amount">{{ formatDateOnly(transaction.dp_date) }} · {{ formatCurrency(transaction.dp_amount) }}</small>
                        <small v-else class="due-date-note">Jatuh tempo: {{ formatDateOnly(transaction.settlement_due_date) }}</small>
                      </template>
                      <button v-if="transaction.dp_proof_path" class="proof-link" type="button" @click="openProofModal(transaction, 'dp')">Preview Bukti Transfer</button>
                      <div v-if="isSuperAdmin && isDpPending(transaction) && transaction.dp_proof_path" class="review-actions">
                        <button class="success compact" type="button" @click="reviewPayment(transaction, 'dp', 'approved')">Approve</button>
                        <button class="danger compact" type="button" @click="reviewPayment(transaction, 'dp', 'rejected')">Reject</button>
                      </div>
                      <small v-if="isDpPending(transaction)" class="proof-warning">Menunggu review <span class="approval-role-label">Super Admin</span></small>
                      <small v-else-if="transaction.dp_payment_status === 'rejected'" class="proof-warning">Down Payment ditolak. Silakan upload ulang bukti transfer.</small>
                      <small v-else-if="transaction.dp_amount && !transaction.dp_proof_path" class="proof-warning">Bukti transfer belum tersedia.</small>
                    </div>
                  </td>
                  <td>
                    <div class="payment-cell">
                      <template v-if="isSettlementApproved(transaction)">
                        <span class="payment-action settlement paid static">Pelunasan</span>
                      </template>
                      <button
                        v-else
                        class="payment-action settlement"
                        :class="{ unpaid: transaction.settled_at && !transaction.settlement_proof_path }"
                        type="button"
                        :disabled="!canSubmitPaymentProof || isSettlementPending(transaction) || !canSubmitSettlement(transaction)"
                        @click="openPaymentModal(transaction, 'settlement')"
                      >
                        Pelunasan
                      </button>
                      <small>{{ transaction.settled_at ? `${formatDateOnly(transaction.settled_at)} · ${formatCurrency(getSettlementAmount(transaction))}` : '-' }}</small>
                      <button v-if="transaction.settlement_proof_path" class="proof-link" type="button" @click="openProofModal(transaction, 'settlement')">Preview Bukti Transfer</button>
                      <div v-if="isSuperAdmin && isSettlementPending(transaction) && transaction.settlement_proof_path" class="review-actions">
                        <button class="success compact" type="button" @click="reviewPayment(transaction, 'settlement', 'approved')">Approve</button>
                        <button class="danger compact" type="button" @click="reviewPayment(transaction, 'settlement', 'rejected')">Reject</button>
                      </div>
                      <small v-if="isSettlementPending(transaction)" class="proof-warning">Menunggu review <span class="approval-role-label">Super Admin</span>.</small>
                      <small v-else-if="transaction.settlement_payment_status === 'rejected'" class="proof-warning">Pelunasan ditolak. Silakan upload ulang bukti transfer.</small>
                      <small v-else-if="transaction.settled_at && !transaction.settlement_proof_path" class="proof-warning">Bukti transfer pelunasan belum tersedia.</small>
                    </div>
                  </td>
                  <td>{{ formatDate(transaction.updated_at) }}</td>
                  <td v-if="canWrite">
                    <div class="row-actions">
                      <button class="secondary compact" type="button" @click="openRecapModal(transaction)">Edit</button>
                      <button class="danger compact" type="button" @click="deleteTransaction(transaction)">Delete</button>
                    </div>
                  </td>
                </tr>
                <tr v-if="!filteredTransactions.length">
                  <td :colspan="canWrite ? 10 : 9" class="empty">Belum ada rekapan {{ selectedCountryLabel }}.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        </section>
      </div>

      <footer class="app-footer">
        <span>© {{ currentYear }} Rekap Transaksi.</span>
        <small>All rights reserved.</small>
      </footer>
    </section>

    <div v-if="showMemberModal" class="modal-backdrop" @click.self="showMemberModal = false">
      <form class="modal" @submit.prevent="addMember">
        <h2>{{ editingMember ? 'Edit Anggota' : 'Add Anggota' }}</h2>
        <label>
          Nama
          <input v-model="memberForm.name" placeholder="Nama anggota" />
        </label>
        <label>
          Nomor WA
          <input v-model="memberForm.whatsappNumber" placeholder="08xxxxxxxxxx" />
        </label>
        <p v-if="modalError" class="error">{{ modalError }}</p>
        <div class="modal-actions">
          <button type="button" class="secondary" @click="showMemberModal = false">Batal</button>
          <button class="primary-action" type="submit">Simpan</button>
        </div>
      </form>
    </div>

    <div v-if="showBatchModal" class="modal-backdrop" @click.self="showBatchModal = false">
      <form class="modal" @submit.prevent="addBatch">
        <h2>Add Batch {{ selectedCountryLabel }}</h2>
        <label>
          Nama Batch
          <input v-model="batchForm.name" placeholder="Contoh: Mei 2026" />
        </label>
        <label>
          From
          <input v-model="batchForm.startDate" :min="todayDate()" type="date" @change="syncBatchDates" />
        </label>
        <label>
          To
          <input v-model="batchForm.endDate" :min="batchForm.startDate || todayDate()" type="date" />
        </label>
        <p v-if="modalError" class="error">{{ modalError }}</p>
        <div class="modal-actions">
          <button type="button" class="secondary" @click="showBatchModal = false">Batal</button>
          <button class="primary-action" type="submit">Simpan</button>
        </div>
      </form>
    </div>

    <div v-if="showCategoryModal" class="modal-backdrop" @click.self="showCategoryModal = false">
      <form class="modal category-modal" @submit.prevent="saveCategory">
        <div class="modal-title-block">
          <span class="modal-kicker">Rekap Category</span>
          <h2>{{ editingCategory ? 'Edit Category' : 'Add Category' }}</h2>
          <p>Atur nama category dan gambar background yang tampil di halaman Rekap.</p>
        </div>

        <div class="category-editor-grid">
          <div class="category-preview-card" :class="{ empty: !categoryImagePreview }">
            <img v-if="categoryImagePreview" :src="categoryImagePreview" alt="Preview category" />
            <div class="category-preview-overlay">
              <span>Preview</span>
              <strong>{{ categoryForm.name || 'Nama Category' }}</strong>
              <small>Background Rekap</small>
            </div>
          </div>

          <div class="category-form-stack">
            <label>
              Nama Rekapan
              <input v-model="categoryForm.name" placeholder="Contoh: Korea" />
            </label>

            <label class="upload-dropzone">
              <input type="file" accept=".jpg,.jpeg,.png,.svg,image/jpeg,image/png,image/svg+xml" @change="onCategoryImageChange" />
              <span class="upload-dropzone-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M12 16V4M8 8l4-4 4 4M5 20h14"/></svg>
              </span>
              <span>
                <strong>{{ categoryForm.image ? categoryForm.image.name : 'Upload image category' }}</strong>
                <small>JPG, JPEG, PNG, atau SVG. Maksimal 5MB.</small>
              </span>
            </label>

            <div v-if="imageUploadState.category" class="upload-progress">
              <span class="upload-spinner" aria-hidden="true"></span>
              <div>
                <strong>Menyiapkan gambar</strong>
                <small>Preview dan file upload sedang diproses.</small>
              </div>
            </div>
          </div>
        </div>
        <p v-if="modalError" class="error">{{ modalError }}</p>
        <div class="modal-actions">
          <button type="button" class="secondary" @click="showCategoryModal = false">Batal</button>
          <button class="primary-action" type="submit" :disabled="imageUploadState.category">{{ imageUploadState.category ? 'Memproses...' : 'Simpan' }}</button>
        </div>
      </form>
    </div>

    <div v-if="showMemberImportModal" class="modal-backdrop" @click.self="!importingMembers && (showMemberImportModal = false)">
      <section class="modal member-import-modal">
        <div class="modal-title-block">
          <span class="modal-kicker">Import Anggota</span>
          <h2>Preview Data Import</h2>
          <p>Periksa data dari file CSV sebelum disimpan ke database. Data dengan nomor WA duplikat tidak akan ikut diimport.</p>
        </div>

        <div class="import-summary-grid">
          <article>
            <span>Total Baris</span>
            <strong>{{ memberImportRows.length }}</strong>
          </article>
          <article>
            <span>Siap Import</span>
            <strong>{{ importableMemberRows.length }}</strong>
          </article>
          <article>
            <span>Perlu Dicek</span>
            <strong>{{ memberImportRows.length - importableMemberRows.length }}</strong>
          </article>
        </div>

        <div v-if="importingMembers" class="import-progress-box">
          <div>
            <strong>Mengimport data anggota</strong>
            <span>{{ memberImportProgress.done }} dari {{ memberImportProgress.total }} data selesai</span>
          </div>
          <div class="import-progress-track">
            <span :style="{ width: `${memberImportPercent}%` }"></span>
          </div>
        </div>

        <div class="table-wrap import-preview-table">
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Nomor WA</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in memberImportRows" :key="row.rowNumber" :class="{ 'row-invalid': !row.valid }">
                <td>{{ row.name || '-' }}</td>
                <td>{{ row.whatsappNumber || '-' }}</td>
                <td>
                  <span :class="row.valid ? 'import-status valid' : 'import-status invalid'">{{ row.valid ? 'Siap import' : row.reason }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p v-if="modalError" class="error">{{ modalError }}</p>
        <div class="modal-actions">
          <button type="button" class="secondary" :disabled="importingMembers" @click="showMemberImportModal = false">Batal</button>
          <button class="primary-action" type="button" :disabled="importingMembers || !importableMemberRows.length" @click="submitMemberImport">
            {{ importingMembers ? 'Mengimport...' : 'Import Data' }}
          </button>
        </div>
      </section>
    </div>

    <div v-if="showRecapImportModal" class="modal-backdrop" @click.self="!importingRecaps && (showRecapImportModal = false)">
      <section class="modal member-import-modal recap-import-modal">
        <div class="modal-title-block">
          <span class="modal-kicker">Import Rekap</span>
          <h2>Preview Data Rekap</h2>
          <p>Periksa batch, anggota, dan nominal sebelum data rekapan disimpan ke dashboard.</p>
        </div>

        <div class="import-summary-grid">
          <article>
            <span>Total Baris</span>
            <strong>{{ recapImportRows.length }}</strong>
          </article>
          <article>
            <span>Siap Import</span>
            <strong>{{ importableRecapRows.length }}</strong>
          </article>
          <article>
            <span>Perlu Dicek</span>
            <strong>{{ recapImportRows.length - importableRecapRows.length }}</strong>
          </article>
        </div>

        <div v-if="importingRecaps" class="import-progress-box">
          <div>
            <strong>Mengimport data rekap</strong>
            <span>{{ recapImportProgress.done }} dari {{ recapImportProgress.total }} data selesai</span>
          </div>
          <div class="import-progress-track">
            <span :style="{ width: `${recapImportPercent}%` }"></span>
          </div>
        </div>

        <div class="table-wrap import-preview-table recap-import-table">
          <table>
            <thead>
              <tr>
                <th>Batch</th>
                <th>Anggota</th>
                <th>Barang</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in recapImportRows" :key="row.rowNumber" :class="{ 'row-invalid': !row.valid }">
                <td>{{ row.batchName || '-' }}</td>
                <td>
                  {{ row.memberName || '-' }}
                  <small class="table-subtext">{{ row.whatsappNumber }}</small>
                </td>
                <td>{{ row.productName || '-' }}</td>
                <td>{{ formatCurrency(row.unitPrice * row.quantity) }}</td>
                <td>
                  <span :class="row.valid ? 'import-status valid' : 'import-status invalid'">{{ row.valid ? 'Siap import' : row.reason }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p v-if="modalError" class="error">{{ modalError }}</p>
        <div class="modal-actions">
          <button type="button" class="secondary" :disabled="importingRecaps" @click="showRecapImportModal = false">Batal</button>
          <button class="primary-action" type="button" :disabled="importingRecaps || !importableRecapRows.length" @click="submitRecapImport">
            {{ importingRecaps ? 'Mengimport...' : 'Import Data' }}
          </button>
        </div>
      </section>
    </div>

    <div v-if="showUserModal" class="modal-backdrop" @click.self="showUserModal = false">
      <form class="modal" @submit.prevent="saveUser">
        <h2>{{ editingUser ? 'Edit User' : 'Add User' }}</h2>
        <label>
          Nama
          <input v-model="userForm.name" placeholder="Nama user" />
        </label>
        <label>
          Username
          <input v-model="userForm.username" autocomplete="off" placeholder="username" />
        </label>
        <label>
          Password
          <input v-model="userForm.password" autocomplete="new-password" type="password" :placeholder="editingUser ? 'Kosongkan jika tidak diganti' : 'Password'" />
        </label>
        <label>
          Role
          <select v-model="userForm.role">
            <option v-for="role in roleOptions" :key="role.value" :value="role.value">{{ role.label }}</option>
          </select>
        </label>
        <p v-if="modalError" class="error">{{ modalError }}</p>
        <div class="modal-actions">
          <button type="button" class="secondary" @click="showUserModal = false">Batal</button>
          <button class="primary-action" type="submit">Simpan</button>
        </div>
      </form>
    </div>

    <div v-if="showRoleModal" class="modal-backdrop" @click.self="showRoleModal = false">
      <form class="modal" @submit.prevent="saveRolePermission">
        <h2>{{ editingRolePermission ? 'Edit Permission' : 'Add Permission' }}</h2>
        <label>
          Nama Permission
          <input v-model="roleForm.label" placeholder="Contoh: Export laporan" />
        </label>
        <label>
          Deskripsi
          <input v-model="roleForm.description" placeholder="Jelaskan akses permission ini" />
        </label>
        <div class="permission-toggle-grid">
          <label class="check-row">
            <input v-model="roleForm.guest" type="checkbox" />
            Guest
          </label>
          <label class="check-row">
            <input v-model="roleForm.admin" type="checkbox" />
            Admin
          </label>
          <label class="check-row disabled">
            <input checked disabled type="checkbox" />
            Super Admin
          </label>
        </div>
        <small class="field-hint">Super Admin selalu aktif untuk semua permission.</small>
        <p v-if="modalError" class="error">{{ modalError }}</p>
        <div class="modal-actions">
          <button type="button" class="secondary" @click="showRoleModal = false">Batal</button>
          <button class="primary-action" type="submit">Simpan</button>
        </div>
      </form>
    </div>

    <div v-if="showRecapModal" class="modal-backdrop" @click.self="showRecapModal = false">
      <form class="modal" @submit.prevent="saveTransaction">
        <h2>{{ editingTransaction ? 'Edit Rekapan' : 'Add Rekapan' }} {{ selectedCountryLabel }}</h2>
        <label>
          Anggota
          <div class="member-picker" :class="{ open: showMemberPicker, disabled: Boolean(editingTransaction) }">
            <button class="member-picker-field" type="button" :disabled="Boolean(editingTransaction)" @click="showMemberPicker = !showMemberPicker">
              <span v-if="!selectedRecapMembers.length">Pilih anggota</span>
              <span v-else>{{ selectedRecapMembers.length }} anggota dipilih</span>
              <strong>⌄</strong>
            </button>
            <div v-if="selectedRecapMembers.length" class="member-chip-row">
              <span v-for="member in selectedRecapMembers" :key="member.id" class="member-chip">
                {{ member.name }}
                <button v-if="!editingTransaction" type="button" @click="removeRecapMember(member.id)">×</button>
              </span>
            </div>
            <div v-if="showMemberPicker && !editingTransaction" class="member-picker-menu">
              <input v-model="recapForm.memberSearch" placeholder="Cari anggota" />
              <button v-for="member in filteredMemberOptions" :key="member.id" class="member-picker-option" type="button" @click="toggleRecapMember(member.id)">
                <span>
                  <strong>{{ member.name }}</strong>
                  <small>{{ member.whatsapp_number }}</small>
                </span>
                <em>{{ recapForm.memberIds.includes(member.id) ? 'Dipilih' : 'Pilih' }}</em>
              </button>
              <p v-if="!filteredMemberOptions.length" class="mini-empty">Anggota tidak ditemukan.</p>
            </div>
          </div>
          <small class="field-hint">{{ editingTransaction ? 'Edit rekapan hanya untuk satu anggota.' : 'Bisa pilih lebih dari satu anggota. Saat disimpan, setiap anggota akan dibuat menjadi row terpisah.' }}</small>
        </label>
        <label>
          Batch
          <select v-model="recapForm.batchId">
            <option disabled value="">Pilih batch</option>
            <option v-for="batch in currentBatches" :key="batch.id" :value="batch.id">{{ batch.name }}</option>
          </select>
        </label>
        <label>
          Nama Barang
          <input v-model="recapForm.productName" placeholder="Contoh: Photocard Sakura" />
        </label>
        <div class="form-grid">
          <label>
            QTY
            <input v-model.number="recapForm.quantity" min="1" type="number" />
          </label>
          <label>
            Harga
            <input :value="formatIdrInput(recapForm.unitPrice)" inputmode="numeric" placeholder="Rp 0" @input="recapForm.unitPrice = parseIdrInput($event.target.value)" />
          </label>
        </div>
        <div class="form-grid">
          <label>
            Jatuh Tempo
            <select v-model.number="recapForm.dueDays" @change="updateSettlementDueDate">
              <option :value="3">3 Hari</option>
              <option :value="7">7 Hari</option>
            </select>
          </label>
          <label>
            Last Payment Down Payment
            <input :value="recapForm.settlementDueDate" disabled />
          </label>
        </div>
        <label>
          Last Payment Pelunasan
          <input v-model="recapForm.settledAt" :min="todayDate()" type="date" />
          <small class="field-hint">Mengisi tanggal ini akan menandai anggota sebagai lunas sejak awal, sehingga Down Payment tidak diperlukan.</small>
        </label>
        <p v-if="modalError" class="error">{{ modalError }}</p>
        <div class="modal-actions">
          <button type="button" class="secondary" @click="showRecapModal = false">Batal</button>
          <button class="primary-action" type="submit">Simpan</button>
        </div>
      </form>
    </div>

    <div v-if="showPaymentModal" class="modal-backdrop" @click.self="showPaymentModal = false">
      <form class="modal payment-upload-modal" @submit.prevent="savePaymentProof">
        <div class="modal-title-block">
          <span class="modal-kicker">Bukti Transfer</span>
          <h2>{{ paymentForm.type === 'dp' ? 'Input Down Payment' : 'Input Pelunasan' }}</h2>
          <p>Upload bukti transfer dengan nominal pembayaran. File akan otomatis diberi watermark member.</p>
        </div>

        <div class="payment-upload-grid">
          <div class="payment-proof-preview" :class="{ empty: !paymentProofPreview }">
            <img v-if="paymentProofPreview" :src="paymentProofPreview" alt="Preview proof transfer" />
            <div v-else>
              <strong>Preview Bukti Transfer</strong>
            </div>
          </div>

          <div class="payment-upload-stack">
            <div class="payment-summary-box">
              <strong>{{ editingPaymentTransaction?.members?.name }}</strong>
              <span>{{ editingPaymentTransaction?.members?.whatsapp_number }}</span>
              <small>{{ editingPaymentTransaction?.product_name }} · {{ formatCurrency(editingPaymentTransaction?.unit_price || 0) }}</small>
              <small v-if="paymentForm.type === 'settlement'">Total barang: {{ formatCurrency(getTransactionTotal(editingPaymentTransaction)) }}</small>
              <small v-if="paymentForm.type === 'settlement' && editingPaymentTransaction?.dp_amount">Down Payment: {{ formatCurrency(editingPaymentTransaction.dp_amount) }}</small>
            </div>

            <label>
              {{ paymentForm.type === 'dp' ? 'Total Down Payment' : 'Nominal Kurang Bayar' }}
              <input :value="formatIdrInput(paymentForm.amount)" inputmode="numeric" placeholder="Rp 0" :disabled="paymentForm.lockAmount" @input="paymentForm.amount = parseIdrInput($event.target.value)" />
            </label>

            <label class="upload-dropzone">
              <input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" @change="onPaymentProofChange" />
              <span class="upload-dropzone-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M12 16V4M8 8l4-4 4 4M5 20h14"/></svg>
              </span>
              <span>
                <strong>{{ paymentForm.proof ? paymentForm.proof.name : 'Upload proof transfer' }}</strong>
                <small>JPG, JPEG, atau PNG. Watermark otomatis sesuai nama dan nomor telepon anggota.</small>
              </span>
            </label>

            <div v-if="imageUploadState.payment" class="upload-progress">
              <span class="upload-spinner" aria-hidden="true"></span>
              <div>
                <strong>Memproses bukti transfer</strong>
                <small>Watermark sedang dibuat sebelum file disimpan.</small>
              </div>
            </div>
          </div>
        </div>

        <p v-if="modalError" class="error">{{ modalError }}</p>
        <div class="modal-actions">
          <button type="button" class="secondary" @click="showPaymentModal = false">Batal</button>
          <button class="primary-action" type="submit" :disabled="imageUploadState.payment">{{ imageUploadState.payment ? 'Mengupload...' : 'Simpan & Sudah Transfer' }}</button>
        </div>
      </form>
    </div>

    <div v-if="showProofModal" class="modal-backdrop" @click.self="showProofModal = false">
      <section class="modal proof-modal">
        <div class="modal-title-block">
          <span class="modal-kicker">Preview Pembayaran</span>
          <h2>{{ proofPreview.title }}</h2>
          <p>Bukti transfer hanya dapat dilihat oleh Super Admin untuk proses validasi pembayaran.</p>
        </div>

        <div class="proof-preview-layout">
          <aside class="proof-info-panel">
            <span>Anggota</span>
            <strong>{{ proofPreview.memberName }}</strong>
            <small>{{ proofPreview.phone }}</small>
            <div>
              <span>Produk</span>
              <small>{{ proofPreview.productName }}</small>
            </div>
          </aside>

          <div class="proof-image-stage">
            <img class="proof-preview-image" :src="getAssetUrl(proofPreview.imagePath)" alt="Bukti transfer" />
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" class="secondary" @click="showProofModal = false">Tutup</button>
        </div>
      </section>
    </div>

  </main>

  <div v-if="sweetAlert.visible" class="sweet-backdrop">
    <section class="sweet-alert" :class="`sweet-${sweetAlert.type}`" role="dialog" aria-modal="true" :aria-label="sweetAlert.title">
      <header class="sweet-header">
        <div class="sweet-title-wrap">
          <div class="sweet-icon" aria-hidden="true">{{ sweetAlertIcon }}</div>
          <h2>{{ sweetAlert.title }}</h2>
        </div>
        <button class="sweet-close" type="button" aria-label="Tutup alert" @click="resolveSweetAlert(false)">×</button>
      </header>
      <div class="sweet-body">
        <p>{{ sweetAlert.message }}</p>
      </div>
      <div class="sweet-actions">
        <button v-if="sweetAlert.showCancel" class="secondary" type="button" @click="resolveSweetAlert(false)">Batal</button>
        <button class="sweet-confirm" type="button" @click="resolveSweetAlert(true)">{{ sweetAlert.confirmText }}</button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { api, getAssetUrl } from './services/api';

const defaultCategories = [
  { label: 'Korea', value: 'korea' },
  { label: 'Jepang', value: 'jepang' },
  { label: 'Thailand', value: 'thailand' },
  { label: 'China', value: 'china' }
];
const allowedCategoryImageTypes = ['image/jpeg', 'image/png', 'image/svg+xml'];
const allowedCategoryImageExtensions = ['jpg', 'jpeg', 'png', 'svg'];

const roleOptions = [
  { label: 'Guest', value: 'guest' },
  { label: 'Admin', value: 'admin' },
  { label: 'Super Admin', value: 'super_admin' }
];
const defaultRolePermissions = [
  {
    key: 'view_dashboard',
    label: 'Akses dashboard',
    description: 'Melihat anggota, category, batch, dan rekapan transaksi.',
    guest: true,
    admin: true
  },
  {
    key: 'payment_upload',
    label: 'Upload bukti pembayaran',
    description: 'Input nominal dan upload bukti transfer Down Payment atau Pelunasan.',
    guest: true,
    admin: true
  },
  {
    key: 'manage_master_data',
    label: 'Kelola data operasional',
    description: 'Tambah, edit, dan hapus anggota, category, batch, dan rekapan.',
    guest: false,
    admin: true
  },
  {
    key: 'review_payment',
    label: 'Approve / reject payment',
    description: 'Review bukti transfer dan menentukan status pembayaran.',
    guest: false,
    admin: false
  },
  {
    key: 'manage_users_roles',
    label: 'Kelola users & roles',
    description: 'Tambah user, ubah role, dan melihat halaman permission.',
    guest: false,
    admin: false
  },
  {
    key: 'clean_database',
    label: 'Bersihkan database',
    description: 'Menghapus data operasional dari aplikasi.',
    guest: false,
    admin: false
  }
];

const session = reactive({
  user: JSON.parse(localStorage.getItem('rekap_user') || 'null')
});

const loginForm = reactive({ username: '', password: '' });
const memberForm = reactive({ name: '', whatsappNumber: '' });
const userForm = reactive({ name: '', username: '', password: '', role: 'guest' });
const roleForm = reactive({ label: '', description: '', guest: false, admin: false });
const batchForm = reactive({ name: '', startDate: '', endDate: '' });
const categoryForm = reactive({ name: '', image: null });
const recapForm = reactive({
  memberId: '',
  memberIds: [],
  memberSearch: '',
  batchId: '',
  productName: '',
  quantity: 1,
  unitPrice: 0,
  paymentStatus: 'dp',
  dpAmount: 0,
  dpDate: '',
  dueDays: 3,
  settlementDueDate: '',
  settledAt: '',
  notes: ''
});
const paymentForm = reactive({ type: 'dp', amount: 0, proof: null, lockAmount: false });
const proofPreview = reactive({ title: '', imagePath: '', memberName: '', phone: '', productName: '' });
const savedMenu = localStorage.getItem('rekap_active_menu') || 'members';
const savedCountry = localStorage.getItem('rekap_selected_country') || '';
const savedBatchId = localStorage.getItem('rekap_selected_batch') || '';
const savedSidebarHidden = localStorage.getItem('rekap_sidebar_hidden') === 'true';
const activeMenu = ref(['members', 'recap', 'database', 'users', 'roles'].includes(savedMenu) ? savedMenu : 'members');
const selectedCountry = ref(savedCountry);
const selectedBatchId = ref(savedBatchId);
const isSidebarHidden = ref(savedSidebarHidden);
const loading = ref(false);
const error = ref('');
const members = ref([]);
const users = ref([]);
const rolePermissions = ref(defaultRolePermissions.map((permission) => ({ ...permission })));
const recapCategories = ref(defaultCategories.map((category) => ({ name: category.label, slug: category.value })));
const memberSearch = ref('');
const recapSearch = ref('');
const importingMembers = ref(false);
const memberImportInput = ref(null);
const showMemberImportModal = ref(false);
const memberImportRows = ref([]);
const memberImportProgress = reactive({ done: 0, total: 0 });
const importingRecaps = ref(false);
const recapImportInput = ref(null);
const showRecapImportModal = ref(false);
const recapImportRows = ref([]);
const recapImportProgress = reactive({ done: 0, total: 0 });
const showMemberModal = ref(false);
const showBatchModal = ref(false);
const showRecapModal = ref(false);
const showCategoryModal = ref(false);
const showUserModal = ref(false);
const showRoleModal = ref(false);
const showPaymentModal = ref(false);
const showProofModal = ref(false);
const showMemberPicker = ref(false);
const modalError = ref('');
const categoryImagePreview = ref('');
const paymentProofPreview = ref('');
const imageUploadState = reactive({ category: false, payment: false });
const cleanConfirm = ref('');
const batchesByCountry = reactive({});
const transactionsByCountry = reactive({});
const editingMember = ref(null);
const editingTransaction = ref(null);
const editingCategory = ref(null);
const editingUser = ref(null);
const editingRolePermission = ref(null);
const editingPaymentTransaction = ref(null);
const currentYear = new Date().getFullYear();
const inactivityLimitMs = 10 * 60 * 1000;
const activityEvents = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];
let inactivityTimer = null;
const sweetAlert = reactive({
  visible: false,
  type: 'success',
  title: '',
  message: '',
  confirmText: 'OK',
  showCancel: false,
  resolve: null
});

const canWrite = computed(() => ['admin', 'super_admin'].includes(session.user?.role));
const canSubmitPaymentProof = computed(() => Boolean(session.user));
const isSuperAdmin = computed(() => session.user?.role === 'super_admin');
const sweetAlertIcon = computed(() => {
  const icons = {
    success: '✓',
    warning: '!',
    error: '×',
    info: 'i'
  };

  return icons[sweetAlert.type] || 'i';
});
const selectedCountryLabel = computed(() => recapCategories.value.find((category) => category.slug === selectedCountry.value)?.name || '');
const currentBatches = computed(() => batchesByCountry[selectedCountry.value] || []);
const currentTransactions = computed(() => transactionsByCountry[selectedCountry.value] || []);
const filteredTransactions = computed(() => {
  const keyword = recapSearch.value.trim().toLowerCase();
  let transactions = currentTransactions.value;

  if (selectedBatchId.value) {
    transactions = transactions.filter((transaction) => transaction.batch_id === selectedBatchId.value);
  }

  if (!keyword) {
    return transactions;
  }

  return transactions.filter((transaction) =>
    `${transaction.members?.name || ''} ${transaction.members?.whatsapp_number || ''}`.toLowerCase().includes(keyword)
  );
});
const filteredMemberOptions = computed(() => {
  const keyword = recapForm.memberSearch.trim().toLowerCase();

  if (!keyword) {
    return members.value;
  }

  return members.value.filter((member) =>
    `${member.name} ${member.whatsapp_number}`.toLowerCase().includes(keyword)
  );
});
const selectedRecapMembers = computed(() => {
  const selectedIds = new Set(recapForm.memberIds);
  return members.value.filter((member) => selectedIds.has(member.id));
});
const importableMemberRows = computed(() => memberImportRows.value.filter((row) => row.valid));
const memberImportPercent = computed(() => {
  if (!memberImportProgress.total) {
    return 0;
  }

  return Math.round((memberImportProgress.done / memberImportProgress.total) * 100);
});
const importableRecapRows = computed(() => recapImportRows.value.filter((row) => row.valid));
const recapImportPercent = computed(() => {
  if (!recapImportProgress.total) {
    return 0;
  }

  return Math.round((recapImportProgress.done / recapImportProgress.total) * 100);
});
const countryTotals = computed(() => {
  return recapCategories.value.reduce((acc, category) => {
    const transactions = transactionsByCountry[category.slug] || [];
    acc[category.slug] = {
      count: transactions.length,
      amount: transactions.reduce((total, item) => total + Number(item.quantity || 0) * Number(item.unit_price || 0), 0)
    };
    return acc;
  }, {});
});
const userRoleCounts = computed(() => {
  return users.value.reduce(
    (acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    },
    { guest: 0, admin: 0, super_admin: 0 }
  );
});
const pageMeta = computed(() => {
  if (activeMenu.value === 'members') {
    return {
      eyebrow: 'Data Anggota',
      title: 'List Anggota',
      subtitle: 'Kelola nama anggota dan nomor WhatsApp dalam satu tempat.'
    };
  }

  if (activeMenu.value === 'database') {
    return {
      eyebrow: 'Database',
      title: 'Bersihkan Data',
      subtitle: 'Hapus data operasional langsung dari aplikasi tanpa membuka Supabase.'
    };
  }

  if (activeMenu.value === 'users') {
    return {
      eyebrow: 'Permission',
      title: 'Users & Roles',
      subtitle: 'Kelola user login dan akses role untuk guest, admin, dan super admin.'
    };
  }

  if (activeMenu.value === 'roles') {
    return {
      eyebrow: 'Roles',
      title: 'Permission Roles',
      subtitle: 'Lihat akses yang tersedia untuk Guest, Admin, dan Super Admin.'
    };
  }

  return {
    eyebrow: selectedCountry.value ? `Category ${selectedCountryLabel.value}` : 'Rekap Transaksi',
    title: selectedCountry.value ? `Rekap ${selectedCountryLabel.value}` : 'Pilih Category',
    subtitle: selectedCountry.value
      ? 'Kelola batch dan rekapan anggota yang membeli category ini.'
      : 'Pilih atau tambah category untuk masuk ke halaman rekapan.'
  };
});
const roleLabel = computed(() => {
  const labels = {
    guest: 'Guest',
    admin: 'Admin',
    super_admin: 'Super Admin'
  };

  return labels[session.user?.role] || '';
});
const userInitials = computed(() => {
  return getInitials(session.user?.name || 'RT');
});

function getInitials(value) {
  return String(value || 'RT')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function showSweetAlert({ type = 'success', title, message, confirmText = 'OK', showCancel = false }) {
  sweetAlert.type = type;
  sweetAlert.title = title;
  sweetAlert.message = message;
  sweetAlert.confirmText = confirmText;
  sweetAlert.showCancel = showCancel;
  sweetAlert.visible = true;

  return new Promise((resolve) => {
    sweetAlert.resolve = resolve;
  });
}

function resolveSweetAlert(value) {
  sweetAlert.visible = false;

  if (sweetAlert.resolve) {
    sweetAlert.resolve(value);
  }

  sweetAlert.resolve = null;
}

function notifySuccess(message, title = 'Berhasil') {
  return showSweetAlert({ type: 'success', title, message });
}

function notifyError(message, title = 'Gagal') {
  return showSweetAlert({ type: 'error', title, message });
}

function confirmAction(message, title = 'Konfirmasi') {
  return showSweetAlert({
    type: 'warning',
    title,
    message,
    confirmText: 'Ya, lanjut',
    showCancel: true
  });
}

async function login() {
  loading.value = true;
  error.value = '';

  try {
    const result = await api.login(loginForm);
    await notifySuccess(`Selamat datang, ${result.user.name}.`, 'Login Berhasil');
    localStorage.setItem('rekap_token', result.token);
    localStorage.setItem('rekap_user', JSON.stringify(result.user));
    session.user = result.user;
    await loadInitialData();
    resetInactivityTimer();
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function loginAsGuest() {
  loginForm.username = 'guest';
  loginForm.password = 'guest123';
  await login();
}

async function logout() {
  const confirmed = await confirmAction('Anda yakin ingin logout dari aplikasi?', 'Logout');

  if (!confirmed) {
    return;
  }

  await notifySuccess('Sesi login akan ditutup.', 'Logout Berhasil');
  clearInactivityTimer();
  clearSessionState();
}

function clearSessionState() {
  localStorage.removeItem('rekap_token');
  localStorage.removeItem('rekap_user');
  localStorage.removeItem('rekap_active_menu');
  localStorage.removeItem('rekap_selected_country');
  localStorage.removeItem('rekap_selected_batch');
  session.user = null;
  activeMenu.value = 'recap';
  selectedCountry.value = '';
  selectedBatchId.value = '';
}

function goToMembers() {
  if (!canWrite.value) {
    goToRecap();
    return;
  }

  closeTransientUi();
  activeMenu.value = 'members';
  selectedCountry.value = '';
  selectedBatchId.value = '';
}

function toggleSidebar() {
  isSidebarHidden.value = !isSidebarHidden.value;
}

function goToRecap() {
  closeTransientUi();
  activeMenu.value = 'recap';
  selectedCountry.value = '';
  selectedBatchId.value = '';
}

function goBackToCategories() {
  closeTransientUi();
  selectedCountry.value = '';
  selectedBatchId.value = '';
}

function goToDatabase() {
  closeTransientUi();
  activeMenu.value = 'database';
  selectedCountry.value = '';
  selectedBatchId.value = '';
}

async function goToUsers() {
  closeTransientUi();
  activeMenu.value = 'users';
  selectedCountry.value = '';
  selectedBatchId.value = '';
  await loadUsers();
}

async function goToRoles() {
  closeTransientUi();
  activeMenu.value = 'roles';
  selectedCountry.value = '';
  selectedBatchId.value = '';
  await loadRolePermissions();
}

function closeTransientUi() {
  showMemberPicker.value = false;
  showMemberImportModal.value = false;
  showRecapImportModal.value = false;
  modalError.value = '';
}

async function loadInitialData() {
  normalizeNavigationForRole();
  await loadCategories();
  if (selectedCountry.value && !recapCategories.value.some((category) => category.slug === selectedCountry.value)) {
    selectedCountry.value = '';
    selectedBatchId.value = '';
  }
  await loadMembers();
  if (isSuperAdmin.value) {
    await loadUsers();
    await loadRolePermissions();
  }
  await Promise.all(recapCategories.value.map((category) => loadCountryData(category.slug)));
}

async function loadCategories() {
  try {
    const categories = await api.getRecapCategories();
    recapCategories.value = categories.length ? categories : recapCategories.value;
  } catch {
    recapCategories.value = recapCategories.value;
  }
}

async function loadMembers() {
  members.value = await api.getMembers(memberSearch.value);
}

function escapeCsvValue(value) {
  const text = String(value ?? '');

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map(escapeCsvValue).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function downloadMemberTemplate() {
  downloadCsv('template-import-anggota.csv', [
    ['nama', 'nomor_wa'],
    ['Nama Anggota', '081234567890']
  ]);
}

function exportMembers() {
  downloadCsv('export-anggota.csv', [
    ['nama', 'nomor_wa'],
    ...members.value.map((member) => [member.name, member.whatsapp_number])
  ]);
}

function openMemberImport() {
  memberImportInput.value?.click();
}

function downloadRecapTemplate() {
  downloadCsv(`template-import-rekap-${selectedCountry.value || 'category'}.csv`, [
    ['batch', 'nama_anggota', 'nomor_wa', 'nama_barang', 'qty', 'harga', 'jatuh_tempo_hari', 'last_payment_pelunasan'],
    ['Batch 1', 'Nama Anggota', '081234567890', 'Photocard Sakura', '1', '25000', '7', '']
  ]);
}

function exportRecaps() {
  downloadCsv(`export-rekap-${selectedCountry.value || 'category'}.csv`, [
    ['batch', 'nama_anggota', 'nomor_wa', 'nama_barang', 'qty', 'harga', 'jatuh_tempo_hari', 'last_payment_pelunasan'],
    ...filteredTransactions.value.map((transaction) => [
      transaction.recap_batches?.name || '',
      transaction.members?.name || '',
      transaction.members?.whatsapp_number || '',
      transaction.product_name,
      transaction.quantity,
      Number(transaction.unit_price || 0),
      transaction.due_days || '',
      transaction.settled_at ? String(transaction.settled_at).slice(0, 10) : ''
    ])
  ]);
}

function openRecapImport() {
  if (!selectedCountry.value) {
    notifyError('Pilih category rekap terlebih dahulu.');
    return;
  }

  recapImportInput.value?.click();
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(value.trim());
      value = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        index += 1;
      }
      row.push(value.trim());
      if (row.some(Boolean)) {
        rows.push(row);
      }
      row = [];
      value = '';
    } else {
      value += char;
    }
  }

  row.push(value.trim());
  if (row.some(Boolean)) {
    rows.push(row);
  }

  return rows;
}

async function importMembersCsv(event) {
  const file = event.target.files?.[0] || null;
  event.target.value = '';

  if (!file) {
    return;
  }

  if (!file.name.toLowerCase().endsWith('.csv')) {
    await notifyError('File import harus berformat CSV.');
    return;
  }

  try {
    const rows = parseCsv(await file.text());
    const [header, ...records] = rows;

    if (!header?.length) {
      throw new Error('Template CSV kosong atau tidak valid.');
    }

    const normalizedHeader = header.map((item) => item.toLowerCase().replace(/\s+/g, '_'));
    const nameIndex = normalizedHeader.findIndex((item) => ['nama', 'name'].includes(item));
    const whatsappIndex = normalizedHeader.findIndex((item) => ['nomor_wa', 'whatsapp_number', 'whatsapp', 'wa'].includes(item));

    if (nameIndex < 0 || whatsappIndex < 0) {
      throw new Error('Header CSV harus memiliki kolom nama dan nomor_wa.');
    }

    const existingNumbers = new Set(members.value.map((member) => normalizeWhatsapp(member.whatsapp_number)));
    const importedNumbers = new Set();
    memberImportRows.value = records
      .map((record, index) => {
        const name = record[nameIndex]?.trim() || '';
        const whatsappNumber = record[whatsappIndex]?.trim() || '';
        const normalizedWhatsapp = normalizeWhatsapp(whatsappNumber);
        let reason = '';

        if (!name || !whatsappNumber) {
          reason = 'Nama dan nomor WA wajib diisi';
        } else if (existingNumbers.has(normalizedWhatsapp)) {
          reason = 'Nomor WA sudah ada';
        } else if (importedNumbers.has(normalizedWhatsapp)) {
          reason = 'Nomor WA duplikat di file';
        }

        if (!reason) {
          importedNumbers.add(normalizedWhatsapp);
        }

        return {
          rowNumber: index + 2,
          name,
          whatsappNumber,
          valid: !reason,
          reason
        };
      })
      .filter((record) => record.name || record.whatsappNumber);

    if (!memberImportRows.value.length) {
      throw new Error('Tidak ada data anggota di file import.');
    }

    memberImportProgress.done = 0;
    memberImportProgress.total = importableMemberRows.value.length;
    modalError.value = importableMemberRows.value.length ? '' : 'Tidak ada data valid untuk diimport.';
    showMemberImportModal.value = true;
  } catch (err) {
    await notifyError(err.message);
  }
}

async function submitMemberImport() {
  const rows = importableMemberRows.value;

  if (!rows.length) {
    modalError.value = 'Tidak ada data valid untuk diimport.';
    return;
  }

  importingMembers.value = true;
  memberImportProgress.done = 0;
  memberImportProgress.total = rows.length;

  try {
    for (const row of rows) {
      await api.addMember({
        name: row.name,
        whatsappNumber: row.whatsappNumber
      });
      memberImportProgress.done += 1;
    }

    await loadMembers();
    showMemberImportModal.value = false;
    memberImportRows.value = [];
    await notifySuccess(`${rows.length} anggota berhasil diimport.`);
  } catch (err) {
    modalError.value = err.message;
    await notifyError(err.message);
  } finally {
    importingMembers.value = false;
  }
}

function getCsvIndex(header, names) {
  return header.findIndex((item) => names.includes(item));
}

function normalizeImportDate(value) {
  const text = String(value || '').trim();

  if (!text) {
    return '';
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const match = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (!match) {
    return '';
  }

  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function calculateDueDate(startDate, dueDays) {
  const date = new Date(`${startDate || todayDate()}T00:00:00`);
  date.setDate(date.getDate() + Number(dueDays || 3));
  return date.toISOString().slice(0, 10);
}

async function importRecapsCsv(event) {
  const file = event.target.files?.[0] || null;
  event.target.value = '';

  if (!file) {
    return;
  }

  if (!file.name.toLowerCase().endsWith('.csv')) {
    await notifyError('File import harus berformat CSV.');
    return;
  }

  try {
    const rows = parseCsv(await file.text());
    const [header, ...records] = rows;

    if (!header?.length) {
      throw new Error('Template CSV kosong atau tidak valid.');
    }

    const normalizedHeader = header.map((item) => item.toLowerCase().replace(/\s+/g, '_'));
    const batchIndex = getCsvIndex(normalizedHeader, ['batch', 'nama_batch']);
    const memberNameIndex = getCsvIndex(normalizedHeader, ['nama_anggota', 'anggota', 'member', 'nama']);
    const whatsappIndex = getCsvIndex(normalizedHeader, ['nomor_wa', 'whatsapp_number', 'whatsapp', 'wa']);
    const productIndex = getCsvIndex(normalizedHeader, ['nama_barang', 'product', 'product_name', 'barang']);
    const qtyIndex = getCsvIndex(normalizedHeader, ['qty', 'quantity']);
    const priceIndex = getCsvIndex(normalizedHeader, ['harga', 'price', 'unit_price']);
    const dueDaysIndex = getCsvIndex(normalizedHeader, ['jatuh_tempo_hari', 'jatuh_tempo', 'due_days']);
    const settledAtIndex = getCsvIndex(normalizedHeader, ['last_payment_pelunasan', 'tanggal_pelunasan', 'settled_at']);

    if ([batchIndex, productIndex, qtyIndex, priceIndex, dueDaysIndex].some((index) => index < 0) || (memberNameIndex < 0 && whatsappIndex < 0)) {
      throw new Error('Header CSV tidak sesuai template import rekap.');
    }

    const batchMap = new Map(currentBatches.value.map((batch) => [batch.name.trim().toLowerCase(), batch]));
    const memberByPhone = new Map(members.value.map((member) => [normalizeWhatsapp(member.whatsapp_number), member]));
    const memberByName = new Map(members.value.map((member) => [member.name.trim().toLowerCase(), member]));

    recapImportRows.value = records
      .map((record, index) => {
        const batchName = record[batchIndex]?.trim() || '';
        const memberName = memberNameIndex >= 0 ? record[memberNameIndex]?.trim() || '' : '';
        const whatsappNumber = whatsappIndex >= 0 ? record[whatsappIndex]?.trim() || '' : '';
        const productName = record[productIndex]?.trim() || '';
        const quantity = Number.parseInt(record[qtyIndex] || '0', 10);
        const unitPrice = parseIdrInput(record[priceIndex] || '0');
        const dueDays = Number.parseInt(record[dueDaysIndex] || '0', 10);
        const settledAt = settledAtIndex >= 0 ? normalizeImportDate(record[settledAtIndex]) : '';
        const batch = batchMap.get(batchName.toLowerCase());
        const member = normalizeWhatsapp(whatsappNumber)
          ? memberByPhone.get(normalizeWhatsapp(whatsappNumber))
          : memberByName.get(memberName.toLowerCase());
        let reason = '';

        if (!batch) {
          reason = 'Batch tidak ditemukan';
        } else if (!member) {
          reason = 'Anggota tidak ditemukan';
        } else if (!productName) {
          reason = 'Nama barang wajib diisi';
        } else if (!Number.isInteger(quantity) || quantity < 1) {
          reason = 'QTY tidak valid';
        } else if (unitPrice < 0) {
          reason = 'Harga tidak valid';
        } else if (![3, 7].includes(dueDays)) {
          reason = 'Jatuh tempo harus 3 atau 7 hari';
        } else if (record[settledAtIndex] && !settledAt) {
          reason = 'Tanggal pelunasan tidak valid';
        }

        return {
          rowNumber: index + 2,
          batchId: batch?.id || '',
          batchName,
          memberId: member?.id || '',
          memberName: member?.name || memberName,
          whatsappNumber: member?.whatsapp_number || whatsappNumber,
          productName,
          quantity: Number.isInteger(quantity) ? quantity : 0,
          unitPrice,
          dueDays,
          settledAt,
          valid: !reason,
          reason
        };
      })
      .filter((record) => record.batchName || record.memberName || record.whatsappNumber || record.productName);

    if (!recapImportRows.value.length) {
      throw new Error('Tidak ada data rekap di file import.');
    }

    recapImportProgress.done = 0;
    recapImportProgress.total = importableRecapRows.value.length;
    modalError.value = importableRecapRows.value.length ? '' : 'Tidak ada data valid untuk diimport.';
    showRecapImportModal.value = true;
  } catch (err) {
    await notifyError(err.message);
  }
}

async function submitRecapImport() {
  const rows = importableRecapRows.value;

  if (!rows.length) {
    modalError.value = 'Tidak ada data valid untuk diimport.';
    return;
  }

  importingRecaps.value = true;
  recapImportProgress.done = 0;
  recapImportProgress.total = rows.length;

  try {
    const importedTransactions = [];

    for (const row of rows) {
      const dpDate = todayDate();
      const transaction = await api.addRecapTransaction(selectedCountry.value, {
        memberId: row.memberId,
        batchId: row.batchId,
        productName: row.productName,
        quantity: row.quantity,
        unitPrice: row.unitPrice,
        paymentStatus: row.settledAt ? 'pelunasan' : 'dp',
        dpAmount: 0,
        dpDate,
        dueDays: row.dueDays,
        settlementDueDate: calculateDueDate(dpDate, row.dueDays),
        settledAt: row.settledAt,
        notes: ''
      });
      importedTransactions.push(transaction);
      recapImportProgress.done += 1;
    }

    transactionsByCountry[selectedCountry.value] = [...importedTransactions, ...(transactionsByCountry[selectedCountry.value] || [])];
    showRecapImportModal.value = false;
    recapImportRows.value = [];
    await notifySuccess(`${rows.length} rekapan berhasil diimport.`);
  } catch (err) {
    modalError.value = err.message;
    await notifyError(err.message);
  } finally {
    importingRecaps.value = false;
  }
}

async function loadUsers() {
  if (!isSuperAdmin.value) {
    users.value = [];
    return;
  }

  users.value = await api.getUsers();
}

async function loadRolePermissions() {
  if (!isSuperAdmin.value) {
    rolePermissions.value = defaultRolePermissions.map((permission) => ({ ...permission }));
    return;
  }

  try {
    const permissions = await api.getRolePermissions();
    rolePermissions.value = permissions.length ? permissions : defaultRolePermissions.map((permission) => ({ ...permission }));
  } catch (err) {
    rolePermissions.value = defaultRolePermissions.map((permission) => ({ ...permission }));
    await notifyError(err.message);
  }
}

async function loadCountryData(country) {
  try {
    const [batches, transactions] = await Promise.all([
      api.getRecapBatches(country),
      api.getRecapTransactions(country)
    ]);
    batchesByCountry[country] = batches;
    transactionsByCountry[country] = transactions;
  } catch {
    batchesByCountry[country] = batchesByCountry[country] || [];
    transactionsByCountry[country] = transactionsByCountry[country] || [];
  }
}

function normalizeNavigationForRole() {
  if (session.user?.role === 'guest') {
    activeMenu.value = 'recap';
    return;
  }

  if (!isSuperAdmin.value && ['database', 'users', 'roles'].includes(activeMenu.value)) {
    activeMenu.value = 'members';
    selectedCountry.value = '';
  }

  if (activeMenu.value !== 'recap') {
    selectedCountry.value = '';
    selectedBatchId.value = '';
  }
}

async function openCountry(country) {
  selectedCountry.value = country;
  selectedBatchId.value = '';
  await loadCountryData(country);
}

function openMemberModal(member = null) {
  const selectedMember = member?.id ? member : null;
  editingMember.value = selectedMember;
  memberForm.name = selectedMember?.name || '';
  memberForm.whatsappNumber = selectedMember?.whatsapp_number || '';
  modalError.value = '';
  showMemberModal.value = true;
}

async function addMember() {
  modalError.value = '';

  try {
    if (editingMember.value) {
      const updatedMember = await api.updateMember(editingMember.value.id, memberForm);
      members.value = members.value.map((member) => (member.id === updatedMember.id ? updatedMember : member));
      await notifySuccess('Data anggota berhasil diupdate.');
    } else {
      await api.addMember(memberForm);
      await loadMembers();
      await notifySuccess('Anggota baru berhasil ditambahkan.');
    }
    showMemberModal.value = false;
  } catch (err) {
    modalError.value = err.message;
    await notifyError(err.message);
  }
}

async function deleteMember(member) {
  const confirmed = await confirmAction(`Hapus anggota ${member.name}?`, 'Hapus Anggota');

  if (!confirmed) {
    return;
  }

  try {
    await api.deleteMember(member.id);
    members.value = members.value.filter((item) => item.id !== member.id);
    await notifySuccess('Anggota berhasil dihapus.');
  } catch (err) {
    await notifyError(err.message);
  }
}

function openBatchModal() {
  const today = todayDate();
  batchForm.name = '';
  batchForm.startDate = today;
  batchForm.endDate = today;
  modalError.value = '';
  showBatchModal.value = true;
}

async function addBatch() {
  modalError.value = '';

  if (batchForm.startDate && batchForm.endDate && batchForm.startDate > batchForm.endDate) {
    modalError.value = 'Tanggal From tidak boleh lebih besar dari tanggal To.';
    return;
  }

  try {
    const batch = await api.addRecapBatch(selectedCountry.value, batchForm);
    batchesByCountry[selectedCountry.value] = [batch, ...(batchesByCountry[selectedCountry.value] || [])];
    selectedBatchId.value = batch.id;
    showBatchModal.value = false;
    await notifySuccess('Batch berhasil ditambahkan.');
  } catch (err) {
    modalError.value = err.message;
    await notifyError(err.message);
  }
}

function syncBatchDates() {
  if (batchForm.startDate && (!batchForm.endDate || batchForm.endDate < batchForm.startDate)) {
    batchForm.endDate = batchForm.startDate;
  }
}

function openCategoryModal(category = null) {
  const selectedCategory = category?.id ? category : null;
  editingCategory.value = selectedCategory;
  categoryForm.name = selectedCategory?.name || '';
  categoryForm.image = null;
  categoryImagePreview.value = selectedCategory?.image_path || '';
  modalError.value = '';
  showCategoryModal.value = true;
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function onCategoryImageChange(event) {
  if (categoryImagePreview.value && categoryImagePreview.value.startsWith('blob:')) {
    URL.revokeObjectURL(categoryImagePreview.value);
  }

  const file = event.target.files?.[0] || null;
  const extension = file?.name?.split('.').pop()?.toLowerCase() || '';

  if (file && !allowedCategoryImageTypes.includes(file.type) && !allowedCategoryImageExtensions.includes(extension)) {
    categoryForm.image = null;
    event.target.value = '';
    modalError.value = 'Format image harus JPG, JPEG, PNG, atau SVG.';
    return;
  }

  modalError.value = '';
  imageUploadState.category = Boolean(file);

  try {
    if (file) {
      await wait(350);
    }

    categoryForm.image = file;
    categoryImagePreview.value = categoryForm.image ? URL.createObjectURL(categoryForm.image) : categoryImagePreview.value;
    if (file) {
      showSweetAlert({
        type: 'info',
        title: 'Image dipilih',
        message: `${file.name} siap diupload saat data disimpan.`
      });
    }
  } finally {
    imageUploadState.category = false;
  }
}

async function saveCategory() {
  modalError.value = '';

  try {
    imageUploadState.category = Boolean(categoryForm.image);
    const formData = new FormData();
    formData.append('name', categoryForm.name);

    if (categoryForm.image) {
      formData.append('image', categoryForm.image);
    }

    const category = editingCategory.value
      ? await api.updateRecapCategory(editingCategory.value.id, formData)
      : await api.addRecapCategory(formData);

    if (editingCategory.value) {
      const oldSlug = editingCategory.value.slug;
      recapCategories.value = recapCategories.value.map((item) => (item.id === category.id ? category : item));

      if (oldSlug !== category.slug) {
        batchesByCountry[category.slug] = batchesByCountry[oldSlug] || [];
        transactionsByCountry[category.slug] = transactionsByCountry[oldSlug] || [];
        delete batchesByCountry[oldSlug];
        delete transactionsByCountry[oldSlug];
        selectedCountry.value = selectedCountry.value === oldSlug ? category.slug : selectedCountry.value;
      }
    } else {
      recapCategories.value = [...recapCategories.value, category];
      batchesByCountry[category.slug] = [];
      transactionsByCountry[category.slug] = [];
    }

    showCategoryModal.value = false;
    await notifySuccess(editingCategory.value ? 'Category rekap berhasil diupdate.' : 'Category rekap berhasil ditambahkan.');
  } catch (err) {
    modalError.value = err.message;
    await notifyError(err.message);
  } finally {
    imageUploadState.category = false;
  }
}

async function deleteCategory(category) {
  const confirmed = await confirmAction(
    `Hapus category ${category.name}? Semua batch dan rekapan di category ini juga akan terhapus.`,
    'Hapus Category'
  );

  if (!confirmed) {
    return;
  }

  try {
    await api.deleteRecapCategory(category.id);
    recapCategories.value = recapCategories.value.filter((item) => item.id !== category.id);
    delete batchesByCountry[category.slug];
    delete transactionsByCountry[category.slug];

    if (selectedCountry.value === category.slug) {
      selectedCountry.value = '';
      selectedBatchId.value = '';
    }
    await notifySuccess('Category rekap berhasil dihapus.');
  } catch (err) {
    modalError.value = err.message;
    await notifyError(err.message);
  }
}

function openUserModal(user = null) {
  const selectedUser = user?.id ? user : null;
  editingUser.value = selectedUser;
  userForm.name = selectedUser?.name || '';
  userForm.username = selectedUser?.username || '';
  userForm.password = '';
  userForm.role = selectedUser?.role || 'guest';
  modalError.value = '';
  showUserModal.value = true;
}

function openRoleModal(permission = null) {
  const selectedPermission = permission?.id || permission?.key ? permission : null;
  editingRolePermission.value = selectedPermission;
  roleForm.label = selectedPermission?.label || '';
  roleForm.description = selectedPermission?.description || '';
  roleForm.guest = Boolean(selectedPermission?.guest);
  roleForm.admin = Boolean(selectedPermission?.admin);
  modalError.value = '';
  showRoleModal.value = true;
}

async function saveRolePermission() {
  modalError.value = '';

  if (!roleForm.label.trim() || !roleForm.description.trim()) {
    modalError.value = 'Nama permission dan deskripsi wajib diisi.';
    return;
  }

  const payload = {
    label: roleForm.label.trim(),
    description: roleForm.description.trim(),
    guest: Boolean(roleForm.guest),
    admin: Boolean(roleForm.admin)
  };

  try {
    const savedPermission = editingRolePermission.value?.id
      ? await api.updateRolePermission(editingRolePermission.value.id, payload)
      : await api.addRolePermission(payload);

    rolePermissions.value = editingRolePermission.value
      ? rolePermissions.value.map((permission) => (permission.id === savedPermission.id ? savedPermission : permission))
      : [...rolePermissions.value, savedPermission];

    showRoleModal.value = false;
    await notifySuccess(editingRolePermission.value ? 'Permission berhasil diupdate.' : 'Permission baru berhasil ditambahkan.');
  } catch (err) {
    modalError.value = err.message;
    await notifyError(err.message);
  }
}

async function saveUser() {
  modalError.value = '';

  if (!editingUser.value && !userForm.password) {
    modalError.value = 'Password wajib diisi untuk user baru.';
    return;
  }

  try {
    const payload = { ...userForm };
    const savedUser = editingUser.value
      ? await api.updateUser(editingUser.value.id, payload)
      : await api.addUser(payload);

    users.value = editingUser.value
      ? users.value.map((user) => (user.id === savedUser.id ? savedUser : user))
      : [savedUser, ...users.value];

    if (savedUser.id === session.user.id) {
      session.user = { ...session.user, name: savedUser.name, username: savedUser.username, role: savedUser.role };
      localStorage.setItem('rekap_user', JSON.stringify(session.user));
    }

    showUserModal.value = false;
    await notifySuccess(editingUser.value ? 'User berhasil diupdate.' : 'User baru berhasil ditambahkan.');
  } catch (err) {
    modalError.value = err.message;
    await notifyError(err.message);
  }
}

async function deleteUser(user) {
  const confirmed = await confirmAction(`Hapus user ${user.name}?`, 'Hapus User');

  if (!confirmed) {
    return;
  }

  try {
    await api.deleteUser(user.id);
    users.value = users.value.filter((item) => item.id !== user.id);
    await notifySuccess('User berhasil dihapus.');
  } catch (err) {
    await notifyError(err.message);
  }
}

async function cleanDatabase() {
  modalError.value = '';
  const confirmed = await confirmAction(
    'Aksi ini dapat menghapus semua data anggota, batch, dan rekapan transaksi. Lanjutkan hanya jika data sudah dibackup atau tidak dibutuhkan.',
    'Bersihkan Database'
  );

  if (!confirmed) {
    return;
  }

  try {
    await api.cleanDatabase();
    members.value = [];
    Object.keys(batchesByCountry).forEach((key) => {
      batchesByCountry[key] = [];
    });
    Object.keys(transactionsByCountry).forEach((key) => {
      transactionsByCountry[key] = [];
    });
    cleanConfirm.value = '';
    await notifySuccess('Database operasional berhasil dibersihkan.');
  } catch (err) {
    modalError.value = err.message;
    await notifyError(err.message);
  }
}

function openRecapModal(transaction = null) {
  const selectedTransaction = transaction?.id ? transaction : null;
  editingTransaction.value = selectedTransaction;
  recapForm.memberId = selectedTransaction?.member_id || '';
  recapForm.memberIds = selectedTransaction?.member_id ? [selectedTransaction.member_id] : [];
  recapForm.memberSearch = '';
  recapForm.batchId = selectedTransaction?.batch_id || selectedBatchId.value || '';
  recapForm.productName = selectedTransaction?.product_name || '';
  recapForm.quantity = selectedTransaction?.quantity || 1;
  recapForm.unitPrice = Number(selectedTransaction?.unit_price || 0);
  recapForm.paymentStatus = selectedTransaction?.payment_status || 'dp';
  recapForm.dpAmount = Number(selectedTransaction?.dp_amount || 0);
  recapForm.dpDate = selectedTransaction?.dp_date || todayDate();
  recapForm.dueDays = selectedTransaction?.due_days || 3;
  recapForm.settlementDueDate = selectedTransaction?.settlement_due_date || '';
  recapForm.settledAt = selectedTransaction?.settled_at ? selectedTransaction.settled_at.slice(0, 10) : '';
  recapForm.notes = selectedTransaction?.notes || '';
  showMemberPicker.value = false;
  updateSettlementDueDate();
  modalError.value = '';
  showRecapModal.value = true;
}

function toggleRecapMember(memberId) {
  if (recapForm.memberIds.includes(memberId)) {
    recapForm.memberIds = recapForm.memberIds.filter((id) => id !== memberId);
    return;
  }

  recapForm.memberIds = [...recapForm.memberIds, memberId];
}

function removeRecapMember(memberId) {
  recapForm.memberIds = recapForm.memberIds.filter((id) => id !== memberId);
}

async function saveTransaction() {
  modalError.value = '';

  try {
    updateSettlementDueDate();
    const selectedMemberIds = editingTransaction.value ? [recapForm.memberId] : recapForm.memberIds;

    if (!selectedMemberIds.length) {
      modalError.value = 'Pilih minimal satu anggota.';
      return;
    }

    const basePayload = {
      ...recapForm,
      paymentStatus: recapForm.settledAt ? 'pelunasan' : 'dp',
      dpDate: recapForm.dpDate || todayDate(),
      dpAmount: 0
    };

    const current = transactionsByCountry[selectedCountry.value] || [];
    if (editingTransaction.value) {
      const transaction = await api.updateRecapTransaction(selectedCountry.value, editingTransaction.value.id, {
        ...basePayload,
        memberId: selectedMemberIds[0]
      });
      transactionsByCountry[selectedCountry.value] = current.map((item) => (item.id === transaction.id ? transaction : item));
    } else {
      const transactions = await Promise.all(
        selectedMemberIds.map((memberId) =>
          api.addRecapTransaction(selectedCountry.value, {
            ...basePayload,
            memberId
          })
        )
      );
      transactionsByCountry[selectedCountry.value] = [...transactions, ...current];
    }
    showRecapModal.value = false;
    await notifySuccess(editingTransaction.value ? 'Rekapan berhasil diupdate.' : 'Rekapan berhasil ditambahkan untuk anggota yang dipilih.');
  } catch (err) {
    modalError.value = err.message;
    await notifyError(err.message);
  }
}

async function settleTransaction(transaction) {
  const confirmed = await confirmAction(`Tandai ${transaction.product_name} sebagai lunas?`, 'Konfirmasi Lunas');

  if (!confirmed) {
    return;
  }

  try {
    const updatedTransaction = await api.settleRecapTransaction(selectedCountry.value, transaction.id);
    transactionsByCountry[selectedCountry.value] = (transactionsByCountry[selectedCountry.value] || []).map((item) =>
      item.id === updatedTransaction.id ? updatedTransaction : item
    );
    await notifySuccess('Rekapan berhasil ditandai lunas.');
  } catch (err) {
    await notifyError(err.message);
  }
}

function openPaymentModal(transaction, type) {
  editingPaymentTransaction.value = transaction;
  paymentForm.type = type;
  paymentForm.lockAmount = type === 'settlement' && Boolean(transaction.settled_at) && !transaction.dp_amount;
  paymentForm.amount = type === 'dp' ? Number(transaction.dp_amount || 0) : getSettlementAmount(transaction);
  paymentForm.proof = null;
  paymentProofPreview.value = '';
  modalError.value = '';
  showPaymentModal.value = true;
}

function isDpPending(transaction) {
  return transaction.dp_payment_status === 'pending';
}

function isDpApproved(transaction) {
  return transaction.dp_payment_status === 'approved';
}

function isSettlementPending(transaction) {
  return transaction.settlement_payment_status === 'pending';
}

function isSettlementApproved(transaction) {
  return transaction.settlement_payment_status === 'approved';
}

function isDirectSettlement(transaction) {
  return Boolean(transaction?.settled_at && !Number(transaction?.dp_amount || 0));
}

function isDirectSettlementApproved(transaction) {
  return isSettlementApproved(transaction) && isDirectSettlement(transaction);
}

function canSubmitSettlement(transaction) {
  if (isSettlementApproved(transaction) || isSettlementPending(transaction)) {
    return false;
  }

  if (transaction.settled_at && !transaction.dp_amount) {
    return true;
  }

  return isDpApproved(transaction);
}

async function reviewPayment(transaction, type, status) {
  const label = type === 'dp' ? 'Down Payment' : 'Pelunasan';
  const action = status === 'approved' ? 'approve' : 'reject';
  const confirmed = await confirmAction(`${action === 'approve' ? 'Approve' : 'Reject'} ${label} untuk ${transaction.members?.name || 'anggota'}?`, 'Review Payment');

  if (!confirmed) {
    return;
  }

  try {
    const updatedTransaction = await api.reviewPayment(selectedCountry.value, transaction.id, { type, status });
    transactionsByCountry[selectedCountry.value] = (transactionsByCountry[selectedCountry.value] || []).map((item) =>
      item.id === updatedTransaction.id ? updatedTransaction : item
    );
    await notifySuccess(`${label} berhasil di-${action}.`);
  } catch (err) {
    await notifyError(err.message);
  }
}

function openProofModal(transaction, type) {
  if (!isSuperAdmin.value) {
    notifyError('Bukti transfer hanya dapat dilihat oleh Super Admin.', 'Akses Dibatasi');
    return;
  }

  proofPreview.title = type === 'dp' ? 'Bukti Transfer Down Payment' : 'Bukti Transfer Pelunasan';
  proofPreview.imagePath = type === 'dp' ? transaction.dp_proof_path : transaction.settlement_proof_path;
  proofPreview.memberName = transaction.members?.name || '-';
  proofPreview.phone = transaction.members?.whatsapp_number || '-';
  proofPreview.productName = transaction.product_name || '-';
  showProofModal.value = true;
}

async function onPaymentProofChange(event) {
  const file = event.target.files?.[0] || null;
  paymentForm.proof = null;
  paymentProofPreview.value = '';
  imageUploadState.payment = Boolean(file);

  if (!file) {
    imageUploadState.payment = false;
    return;
  }

  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    event.target.value = '';
    modalError.value = 'Format proof transfer harus JPG, JPEG, atau PNG.';
    imageUploadState.payment = false;
    return;
  }

  try {
    const watermarkedFile = await createWatermarkedProof(file, editingPaymentTransaction.value);
    paymentForm.proof = watermarkedFile;
    paymentProofPreview.value = URL.createObjectURL(watermarkedFile);
    modalError.value = '';
  } catch (err) {
    event.target.value = '';
    modalError.value = err.message;
  } finally {
    imageUploadState.payment = false;
  }
}

function createWatermarkedProof(file, transaction) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      const maxWidth = 1400;
      const scale = Math.min(1, maxWidth / image.width);
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      const memberName = transaction?.members?.name || 'Member';
      const phone = transaction?.members?.whatsapp_number || '-';
      const watermark = `${memberName} · ${phone}`;
      const fontSize = Math.max(28, Math.round(canvas.width * 0.065));

      context.save();
      context.translate(canvas.width / 2, canvas.height / 2);
      context.rotate((-24 * Math.PI) / 180);
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.font = `800 ${fontSize}px Inter, Arial, sans-serif`;
      context.globalAlpha = 0.8;
      context.lineWidth = Math.max(3, Math.round(fontSize * 0.08));
      context.strokeStyle = 'rgba(0, 0, 0, 0.28)';
      context.fillStyle = 'rgba(255, 255, 255, 0.8)';
      context.strokeText(watermark, 0, 0);
      context.fillText(watermark, 0, 0);
      context.restore();

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Gagal membuat watermark proof transfer.'));
          return;
        }

        resolve(new File([blob], `watermarked-${Date.now()}.png`, { type: 'image/png' }));
      }, 'image/png', 0.92);
    };
    image.onerror = () => reject(new Error('Gambar proof transfer tidak bisa dibaca.'));
    image.src = URL.createObjectURL(file);
  });
}

async function savePaymentProof() {
  modalError.value = '';

  if (!paymentForm.proof || paymentForm.amount < 0) {
    modalError.value = 'Nominal dan proof transfer wajib diisi.';
    return;
  }

  const paymentLabel = paymentForm.type === 'dp' ? 'Down Payment' : 'Pelunasan';
  const confirmed = await confirmAction(
    `Upload bukti transfer ${paymentLabel} sebesar ${formatCurrency(paymentForm.amount)}?`,
    'Konfirmasi Upload'
  );

  if (!confirmed) {
    return;
  }

  const formData = new FormData();
  const endpoint = paymentForm.type === 'dp' ? api.submitDpPayment : api.submitSettlementPayment;
  formData.append(paymentForm.type === 'dp' ? 'dpAmount' : 'settlementAmount', String(paymentForm.amount));
  formData.append('proof', paymentForm.proof);

  try {
    imageUploadState.payment = true;
    const transaction = await endpoint(selectedCountry.value, editingPaymentTransaction.value.id, formData);
    transactionsByCountry[selectedCountry.value] = (transactionsByCountry[selectedCountry.value] || []).map((item) =>
      item.id === transaction.id ? transaction : item
    );
    showPaymentModal.value = false;
    await notifySuccess(paymentForm.type === 'dp' ? 'Down Payment berhasil disimpan.' : 'Pelunasan berhasil disimpan.');
  } catch (err) {
    modalError.value = err.message;
    await notifyError(err.message);
  } finally {
    imageUploadState.payment = false;
  }
}

function updateSettlementDueDate() {
  if (!recapForm.dpDate) {
    recapForm.dpDate = todayDate();
  }

  const date = new Date(`${recapForm.dpDate}T00:00:00`);
  date.setDate(date.getDate() + Number(recapForm.dueDays || 3));
  recapForm.settlementDueDate = date.toISOString().slice(0, 10);
}

async function deleteTransaction(transaction) {
  const confirmed = await confirmAction(`Hapus rekapan ${transaction.product_name}?`, 'Hapus Rekapan');

  if (!confirmed) {
    return;
  }

  try {
    await api.deleteRecapTransaction(selectedCountry.value, transaction.id);
    transactionsByCountry[selectedCountry.value] = (transactionsByCountry[selectedCountry.value] || []).filter((item) => item.id !== transaction.id);
    await notifySuccess('Rekapan berhasil dihapus.');
  } catch (err) {
    await notifyError(err.message);
  }
}

function formatDate(value) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function formatDateOnly(value) {
  if (!value) {
    return '-';
  }

  const date = String(value).includes('T') ? new Date(value) : new Date(`${value}T00:00:00`);

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium'
  }).format(date);
}

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(value || 0);
}

function parseIdrInput(value) {
  return Number(String(value || '').replace(/[^\d]/g, '') || 0);
}

function formatIdrInput(value) {
  return formatCurrency(parseIdrInput(value));
}

function normalizeWhatsapp(value) {
  return String(value || '').replace(/\D/g, '');
}

function getTransactionTotal(transaction) {
  return Number(transaction?.unit_price || 0) * Number(transaction?.quantity || 1);
}

function getSettlementAmount(transaction) {
  if (transaction?.settlement_amount !== null && transaction?.settlement_amount !== undefined) {
    return Number(transaction.settlement_amount || 0);
  }

  if (transaction?.settled_at && !transaction?.dp_amount) {
    return getTransactionTotal(transaction);
  }

  return Math.max(getTransactionTotal(transaction) - Number(transaction?.dp_amount || 0), 0);
}

function paymentLabel(value) {
  return value === 'pelunasan' ? 'Sudah Lunas' : 'Down Payment';
}

function formatRole(value) {
  return roleOptions.find((role) => role.value === value)?.label || value;
}

function todayDate() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function clearInactivityTimer() {
  if (inactivityTimer) {
    window.clearTimeout(inactivityTimer);
  }

  inactivityTimer = null;
}

function resetInactivityTimer() {
  if (!session.user) {
    return;
  }

  clearInactivityTimer();
  inactivityTimer = window.setTimeout(handleInactiveSession, inactivityLimitMs);
}

async function handleInactiveSession() {
  if (!session.user) {
    return;
  }

  clearSessionState();
  await notifyError('Sesi Anda berakhir karena tidak ada aktivitas selama lebih dari 10 menit.', 'Session Expired');
}

function registerActivityListeners() {
  activityEvents.forEach((eventName) => {
    window.addEventListener(eventName, resetInactivityTimer, { passive: true });
  });
}

function unregisterActivityListeners() {
  activityEvents.forEach((eventName) => {
    window.removeEventListener(eventName, resetInactivityTimer);
  });
}

watch(activeMenu, (value) => {
  localStorage.setItem('rekap_active_menu', value);
});

watch(selectedCountry, (value) => {
  localStorage.setItem('rekap_selected_country', value);
});

watch(selectedBatchId, (value) => {
  localStorage.setItem('rekap_selected_batch', value);
});

watch(isSidebarHidden, (value) => {
  localStorage.setItem('rekap_sidebar_hidden', String(value));
});

onMounted(() => {
  registerActivityListeners();
  if (session.user) {
    loadInitialData();
    resetInactivityTimer();
  }
});

onUnmounted(() => {
  unregisterActivityListeners();
  clearInactivityTimer();
});
</script>
