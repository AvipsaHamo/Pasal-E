import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';
import { ShopService, FeaturedProductItem } from '../core/services/shop.service';
import { ImageProxyPipe } from '../core/pipes/image-proxy.pipe';
import { ShopInfo, CategoryDetail } from '../core/models/shop.models';
import { ProductListItem } from '../core/models/inventory.models';
import { InventoryService } from '../core/services/inventory.service';
import { DestroyableComponent } from '../core/base/destroyable.base';

@Component({
  selector: 'app-your-shop',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ImageProxyPipe],
  templateUrl: './your-shop.component.html',
  styleUrls: ['./your-shop.component.css']
})
export class YourShopComponent extends DestroyableComponent implements OnInit {
  shop:       ShopInfo | null  = null;
  categories: CategoryDetail[] = [];
  loading     = true;
  loadError   = '';
  saving      = false;
  saveMsg     = '';
  saveError   = '';
  copySuccess = false;

  // Featured products
  featured: FeaturedProductItem[] = [];
  allProducts: ProductListItem[] = [];
  selectedFeaturedId: number | null = null;
  addFeaturedError = '';
  showAddFeatured = false;
  addingFeatured = false;

  // Delete confirmation modal for featured items
  showDeleteConfirmModal = false;
  deleteFeaturedId: number | null = null;
  deleteFeaturedName = '';
  deletingFeatured = false;
  deleteError = '';

  uploadingLogo    = false;
  uploadingBanner  = false;
  uploadingCatImg  = false;
  uploadError      = '';
  newCategoryImageUrl: string | null = null;

  showAddCategory  = false;
  addingCategory   = false;
  addCategoryError = '';

  readonly themes  = ['Light', 'Dark'];
  readonly colours = ['Green', 'Blue', 'Red', 'Purple', 'Pink', 'Brown', 'Gray'];

  shopForm = this.fb.group({
    brandName:        [''],
    physicalLocation: [''],
    theme:            [''],
    colour:           ['']
  });

  categoryForm = this.fb.group({
    name: ['', Validators.required]
  });

  constructor(private shopSvc: ShopService, private invSvc: InventoryService, private fb: FormBuilder) { super(); }

  ngOnInit(): void {
    this.loadShop();
    this.loadCategories();
    this.loadFeatured();
    this.loadAllProducts();
  }

  private loadShop(): void {
    this.loading   = true;
    this.loadError = '';
    this.shopSvc.getShop()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: s => {
          this.shop    = s;
          this.loading = false;
          this.shopForm.patchValue({
            brandName:        s.brandName        ?? '',
            physicalLocation: s.physicalLocation ?? '',
            theme:            s.theme            ?? '',
            colour:           s.colour           ?? ''
          });
        },
        error: (err: { error?: { message?: string } }) => {
          this.loading   = false;
          this.loadError = err?.error?.message ?? 'Failed to load shop details.';
        }
      });
  }

  loadCategories(): void {
    this.shopSvc.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  c => this.categories = c,
        error: (err: { error?: { message?: string } }) =>
          console.error('Failed to load categories:', err?.error?.message ?? err)
      });
  }

  get subdomainUrl(): string {
    return this.shop?.subdomain
      ? `${this.shop.subdomain}.pasal-e.me`
      : 'yourshopname.pasal-e.me';
  }

  get statusClass(): string {
    const map: Record<string, string> = {
      pending:     'status-pending',
      approved:    'status-approved',
      disapproved: 'status-disapproved'
    };
    return map[this.shop?.subdomainStatus ?? 'pending'] ?? '';
  }

  copySubdomain(): void {
    navigator.clipboard.writeText(this.subdomainUrl)
      .then(() => {
        this.copySuccess = true;
        setTimeout(() => this.copySuccess = false, 2000);
      })
      .catch(() => console.error('Clipboard copy failed'));
  }

  onLogoUpload(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadingLogo = true;
    this.uploadError   = '';

    this.shopSvc.uploadImage(file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.uploadingLogo = false;
          this.shopSvc.updateShop({ logoImage: res.url })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next:  s => this.shop = s,
              error: (err: { error?: { message?: string } }) => {
                this.uploadError = err?.error?.message ?? 'Failed to save logo.';
              }
            });
        },
        error: (err: { error?: { message?: string } }) => {
          this.uploadingLogo = false;
          this.uploadError   = err?.error?.message ?? 'Logo upload failed.';
        }
      });
  }

  onBannerUpload(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadingBanner = true;
    this.uploadError     = '';

    this.shopSvc.uploadImage(file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.uploadingBanner = false;
          this.shopSvc.updateShop({ bannerImage: res.url })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next:  s => this.shop = s,
              error: (err: { error?: { message?: string } }) => {
                this.uploadError = err?.error?.message ?? 'Failed to save banner.';
              }
            });
        },
        error: (err: { error?: { message?: string } }) => {
          this.uploadingBanner = false;
          this.uploadError     = err?.error?.message ?? 'Banner upload failed.';
        }
      });
  }

  onCategoryImageUpload(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadingCatImg = true;
    this.uploadError     = '';

    this.shopSvc.uploadImage(file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.uploadingCatImg    = false;
          this.newCategoryImageUrl = res.url;
        },
        error: (err: { error?: { message?: string } }) => {
          this.uploadingCatImg = false;
          this.uploadError     = err?.error?.message ?? 'Image upload failed.';
        }
      });
  }

  onSaveShop(): void {
    this.saving    = true;
    this.saveMsg   = '';
    this.saveError = '';
    const v = this.shopForm.value;

    this.shopSvc.updateShop({
      brandName:        v.brandName        || undefined,
      physicalLocation: v.physicalLocation || undefined,
      theme:            v.theme            || undefined,
      colour:           v.colour           || undefined
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: s => {
          this.shop    = s;
          this.saving  = false;
          this.saveMsg = 'Saved!';
          setTimeout(() => this.saveMsg = '', 2500);
        },
        error: (err: { error?: { message?: string } }) => {
          this.saving    = false;
          this.saveError = err?.error?.message ?? 'Failed to save shop details.';
        }
      });
  }

  // openAddCategory(): void {
  //   this.categoryForm.reset();
  //   this.newCategoryImageUrl = null;
  //   this.addCategoryError    = '';
  //   this.showAddCategory     = true;
  // }

  // closeAddCategory(): void { this.showAddCategory = false; }

  // onAddCategory(): void {
  //   if (this.categoryForm.invalid) { this.categoryForm.markAllAsTouched(); return; }
  //   this.addingCategory   = true;
  //   this.addCategoryError = '';

  //   const name = this.categoryForm.value.name ?? '';

  //   this.shopSvc.addCategory({ name, image: this.newCategoryImageUrl ?? undefined })
  //     .pipe(takeUntil(this.destroy$))
  //     .subscribe({
  //       next: () => {
  //         this.addingCategory  = false;
  //         this.showAddCategory = false;
  //         this.loadCategories();
  //       },
  //       error: (err: { error?: { message?: string } }) => {
  //         this.addingCategory   = false;
  //         this.addCategoryError = err?.error?.message ?? 'Failed to add category.';
  //       }
  //     });
  // }

  // deleteCategory(id: number): void {
  //   if (!confirm('Delete this category? Products in this category will be uncategorised.')) return;
  //   this.shopSvc.deleteCategory(id)
  //     .pipe(takeUntil(this.destroy$))
  //     .subscribe({
  //       next:  () => this.loadCategories(),
  //       error: (err: { error?: { message?: string } }) =>
  //         console.error('Delete failed:', err?.error?.message ?? err)
  //     });
  // }

  // Featured
  get availableToFeature(): ProductListItem[] {
    const featuredIds = new Set(this.featured.map(f => f.productId));
    return this.allProducts.filter(p => !featuredIds.has(p.productId));
  }

  openAddFeatured(): void { this.selectedFeaturedId = null; this.addFeaturedError = ''; this.showAddFeatured = true; }
  closeAddFeatured(): void { this.showAddFeatured = false; }

  onAddFeatured(): void {
    if (!this.selectedFeaturedId) { this.addFeaturedError = 'Please select a product.'; return; }
    this.addingFeatured = true; this.addFeaturedError = '';
    this.shopSvc.addFeatured(this.selectedFeaturedId).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.addingFeatured = false; this.showAddFeatured = false; this.loadFeatured(); },
      error: (err: { error?: { message?: string } }) => { this.addingFeatured = false; this.addFeaturedError = err?.error?.message ?? 'Failed to add.'; }
    });
  }

  removeFeatured(featuredId: number): void {
    this.shopSvc.removeFeatured(featuredId).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => this.loadFeatured(),
      error: (err: { error?: { message?: string } }) => console.error('Remove featured failed:', err?.error?.message)
    });
  }

  openDeleteConfirmFeaturedModal(featuredId: number, productName: string): void {
    this.deleteFeaturedId = featuredId;
    this.deleteFeaturedName = productName;
    this.deleteError = '';
    this.showDeleteConfirmModal = true;
  }

  closeDeleteConfirmModal(): void {
    this.showDeleteConfirmModal = false;
    this.deleteFeaturedId = null;
    this.deleteFeaturedName = '';
    this.deleteError = '';
  }

  onConfirmDeleteFeatured(): void {
    if (!this.deleteFeaturedId) return;
    this.deletingFeatured = true;
    this.deleteError = '';
    this.shopSvc.removeFeatured(this.deleteFeaturedId).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.deletingFeatured = false;
        this.showDeleteConfirmModal = false;
        this.loadFeatured();
      },
      error: (err: { error?: { message?: string } }) => {
        this.deletingFeatured = false;
        this.deleteError = err?.error?.message ?? 'Failed to remove featured.';
      }
    });
  }

  private loadFeatured(): void {
    this.shopSvc.getFeatured().pipe(takeUntil(this.destroy$)).subscribe({
      next: f => this.featured = f,
      error: err => console.error('Failed to load featured:', err)
    });
  }

  private loadAllProducts(): void {
    this.invSvc.getProducts().pipe(takeUntil(this.destroy$)).subscribe({
      next: p => this.allProducts = p,
      error: err => console.error('Failed to load products:', err)
    });
  }

}

